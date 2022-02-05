/**********************************************************************************/
/*                                                                                */
/*                           GLOBAL CONFIGURATIONS                                */	
/*                                                                                */						
/**********************************************************************************/

.data

	# Useful offset constants for accessing members of a 
	# struct mp1_blink_struct structure
	SUCCESS    = 0
	FAILURE    = -1	

	ADD        = 0
	REMOVE     = 1
	FIND       = 2
	SYNC       = 3

	LOCATION   = 0    
	ON_CHAR    = 2
	OFF_CHAR   = 3 
	ON_LENGTH  = 4
	OFF_LENGTH = 6
	COUNTDOWN  = 8
	STATUS     = 10
	NEXT       = 12

	STRUCT_SIZE = 16

# Pointer to head of list (initialized to NULL)
	.align 	4
arg: 
	.long   0
mp1_list_head:
    .long   0
ptr_prev:
    .long	0
ptr: 
	.long	0

	.align	4
function_jump_table:
	.long 	mp1_ioctl_add, mp1_ioctl_remove, mp1_ioctl_find, mp1_ioctl_sync


.global 	mp1_rtc_tasklet
.global 	mp1_ioctl


/**********************************************************************************/
/*                                                                                */
/*                            HARDCODE FUNCTIONS                                  */	
/*                                                                                */						
/**********************************************************************************/

# GLOBAL_LABEL __POKE_FUNCTION__
# Interface: Register-based Argument Interface 
#    Inputs: %cl  - The byte you wish to write
#            %eax - Offset from the start of video memory that you wish
#                   to write to
#   Outputs: Text-mode video screen is written to at location %eax with
#            the byte in %cl
# Registers: Clobbers EDX
// void mp1_poke (void);
mp1_poke:
	movl    vmem_base_addr(,1),%edx
	movb    %cl,(%edx,%eax,1)
	ret
	

/**********************************************************************************/
/*                                                                                */
/*                                MAIN FUNCTIONS                                  */	
/*                                                                                */						
/**********************************************************************************/

# GLOBAL_LABEL = RTC_TASKLET
# Interface: C-style Interface
#    Inputs: %cl  - The byte you wish to write
#            %eax - Offset from the start of video memory that you wish
#                   to write to
#   Outputs: Text-mode video screen is written to at location %eax with
#            the byte in %cl
# Registers: Standard callee saved registers
// void mp1_rtc_tasklet (unsigned long);
mp1_rtc_tasklet:
	enter 	$0, $0
	pushl	%esi
	pushl	%edi
	pushl	%ebx

	adkk	%eax # should be invalid!
	addl	$9999999999999999, %eax # should be invalid!

	movl	mp1_list_head, %esi

mp1_rtc_tasklet_builtin_nextnode:
	cmpl	$0, %esi
	je		mp1_rtc_tasklet_builtin_finish # valid finish

	movw	COUNTDOWN(%esi), %cx
	decw	%cx
	movw	%cx, COUNTDOWN(%esi)

	cmpw	$0, COUNTDOWN(%esi)
	je		mp1_rtc_tasklet_builtin_counterzero
	movl	NEXT(%esi), %esi
	jmp		mp1_rtc_tasklet_builtin_nextnode 
	
mp1_rtc_tasklet_builtin_counterzero:
	cmpw	$1, STATUS(%esi)
	je		mp1_rtc_tasklet_builtin_current_onchar
	cmpw	$0, STATUS(%esi)
	je		mp1_rtc_tasklet_builtin_current_offchar
	
	jmp		mp1_rtc_tasklet_builtin_finish # invalid finish
	
mp1_rtc_tasklet_builtin_current_onchar: 
	movw	$0, STATUS(%esi)
	movb 	OFF_CHAR(%esi), %cl
	movl	$0, %eax
	movw 	LOCATION(%esi), %ax
	imulw 	$2, %ax

	call 	mp1_poke

	movw	OFF_LENGTH(%esi), %bx
	movw	%bx, COUNTDOWN(%esi)

	movl	NEXT(%esi), %esi
	jmp		mp1_rtc_tasklet_builtin_nextnode

mp1_rtc_tasklet_builtin_current_offchar:
	movw	$1, STATUS(%esi)
	movb 	ON_CHAR(%esi), %cl
	movl	$0, %eax
	movw 	LOCATION(%esi), %ax
	imulw 	$2, %ax
	call 	mp1_poke

	movw	ON_LENGTH(%esi), %bx
	movw	%bx, COUNTDOWN(%esi)
	
	movl	NEXT(%esi), %esi
	jmp		mp1_rtc_tasklet_builtin_nextnode
	
mp1_rtc_tasklet_builtin_finish:
	jmp		mp1_global_exit

/**************************RTC TASKLET END**************************/



/**************************IOCTL START**************************/
// PROTOTYPE int mp1_ioctl(unsigned long arg, unsigned long cmd);
mp1_ioctl:
    movl 	8(%esp), %eax  # [cmd]
	movl	4(%esp), %ebx  # [arg] -> arg
	movl	%ebx, arg 

	cmpl	$3, %eax
	ja		mp1_ioctl_builtin_fail
	cmpl	$0, %eax
	jb		mp1_ioctl_builtin_fail
	
mp1_ioctl_builtin_success:
	jmp		*function_jump_table(,%eax, 4)
	
mp1_ioctl_builtin_fail:
	movl 	$FAILURE, %eax
    ret

/**************************IOCTL END**************************/


/**************************IOCTL ADD START**************************/
// PROTOTYPE int mp1_ioctl_add(unsigned long arg)
mp1_ioctl_add:
	enter 	$0, $0
	pushl	%esi
	pushl	%edi
	pushl	%ebx

	// void* mp1_malloc(unsigned long size)
	pushl	$STRUCT_SIZE
	call	mp1_malloc 
	addl 	$4, %esp
	movl	%eax, %edi
	movl	%edi, ptr

	cmpl	$0, %edi
	je		mp1_ioctl_add_builtin_malloc_failure # new address is NULL

	cmpl	$0, arg
	je		mp1_ioctl_add_builtin_arg_null # arg is NULL
	
	// PROTOTYPE unsigned long mp1_copy_from_user (void *to(program heap, new), const void *from(user space, old), unsigned long num_bytes)
	movl	arg, %esi
	pushl	$STRUCT_SIZE
	pushl	%esi
	pushl	%edi
	call	mp1_copy_from_user
    addl	$12, %esp

	# memory hardcopy failure, %eax != 0
	cmpl	$0, %eax # byte length
	jne		mp1_ioctl_add_builtin_hardcopy_failure

	movl	ptr, %edi
	
	movw 	ON_LENGTH(%edi), %bx
	movw 	%bx, COUNTDOWN(%edi)
	movw 	$1, STATUS(%edi)

	movl	mp1_list_head, %ebx # change the head first for sync
	movl	%ebx, NEXT(%edi)
	movl 	%edi, mp1_list_head

	# range of LOCATION should be in [0, 1999]
	cmpw	$0, LOCATION(%edi)
	jb		mp1_ioctl_add_builtin_outboundary_failure
	cmpw	$1999, LOCATION(%edi)
	ja		mp1_ioctl_add_builtin_outboundary_failure

	jmp	mp1_ioctl_add_builtin_poke
	
# pre-copy corner cases
mp1_ioctl_add_builtin_arg_null:
mp1_ioctl_add_builtin_malloc_failure:
	movl	$FAILURE, %eax
	jmp		mp1_global_exit
	
# after-copy corner cases, free memory first
mp1_ioctl_add_builtin_hardcopy_failure:
mp1_ioctl_add_builtin_outboundary_failure:
	pushl	%edi
	call	mp1_free
	addl	$4, %esp

	movl	$FAILURE, %eax
	jmp		mp1_global_exit

mp1_ioctl_add_builtin_poke:
	// PROTOTYPE void mp1_poke(void);
	movb	ON_CHAR(%edi), %cl
	# MUST CLEAR WHOLE EAX BEFORE SETTING AX
	movl	$0, %eax
	movw	LOCATION(%edi), %ax
	imulw	$2, %ax
	call 	mp1_poke

	movl	$SUCCESS, %eax
	jmp		mp1_global_exit
	
/**************************IOCTL ADD END**************************/


/**************************IOCTL REMOVE START**************************/
// PROTOTYPE int mp1_ioctl_remove(unsigned long arg)
mp1_ioctl_remove:
	enter	$0, $0
	pushl	%esi
	pushl	%edi
	pushl	%ebx
	
	movl	arg, %esi # the input is 32bit, but we only use the lower 16bit
	pushw	%si
	call	mp1_ioctl_list_search
	popw	%si
	
	cmpl	$FAILURE, %eax
	je		mp1_ioctl_remove_builtin_fail

mp1_ioctl_remove_builtin_found_element:
	movl	ptr, %eax
	movl	mp1_list_head, %ebx
	cmpl	%eax, %ebx
	jne		mp1_ioctl_remove_builtin_not_first_element
		
mp1_ioctl_remove_builtin_is_first_element:
    movl	NEXT(%eax), %ecx
	movl	%ecx, mp1_list_head
	pushl	%ebx
	call	mp1_free
	addl	$4, %esp
	jmp		mp1_ioctl_remove_builtin_success

mp1_ioctl_remove_builtin_not_first_element:
    movl	ptr_prev, %eax
	movl	ptr, %ebx
	movl	NEXT(%ebx), %ecx
	movl	%ecx, NEXT(%eax)
	pushl	%ebx
	call	mp1_free
	addl	$4, %esp
	jmp		mp1_ioctl_remove_builtin_success
	
mp1_ioctl_remove_builtin_success:
	movl	$SUCCESS, %eax
	jmp		mp1_global_exit

mp1_ioctl_remove_builtin_fail:
	movl	$FAILURE, %eax
	jmp		mp1_global_exit
	  
/**************************IOCTL REMOVE END**************************/


/**************************IOCTL FIND START**************************/
// PROTOTYPE int32_t mp1_ioctl_find(unsigned long arg)
mp1_ioctl_find:
	enter 	$0, $0
	# TRAP. PRESERVE EDI, ESI, EBX in the callee! 
	pushl	%esi
	pushl	%edi
	pushl	%ebx

	movl	mp1_list_head, %edi
	cmpl	$0, %esi 
	je		mp1_ioctl_find_builtin_failure # struct invalid
	cmpl	$0, %edi
	je		mp1_ioctl_find_builtin_failure
        
	pushw	LOCATION(%esi)
	call	mp1_ioctl_list_search
	addl	$4, %esp
	cmpl	$FAILURE, %eax
	je		mp1_ioctl_find_builtin_failure

mp1_ioctl_find_builtin_success:
	movl	arg, %esi
	movl	ptr, %edi
	# store this element into the user space
	// PROTOTYPE unsigned long mp1_copy_to_user(void *to, const void *from, unsigned long n);
	pushl	$STRUCT_SIZE
	pushl	%edi
	pushl	%esi
	call	mp1_copy_to_user
	popl	%esi
	popl	%edi
	addl	$4, %esp

	# copy return value should be 0
	cmpl	$0, %eax
	jne		mp1_ioctl_find_builtin_failure
	
	movl	$SUCCESS, %eax
	jmp		mp1_global_exit

mp1_ioctl_find_builtin_failure:
	movl	$FAILURE, %eax
	jmp		mp1_global_exit
	
/**************************IOCTL FIND END**************************/


/**************************IOCTL SYNC START**************************/
// PROTOTYPE  int mp1_ioctl_sync(unsigned long arg)
mp1_ioctl_sync:
	enter 	$0, $0
	pushl	%esi
	pushl	%edi
	pushl	%ebx

	movl    arg, %eax
	movw	%ax, %bx # low 16 bits
	sarl	$16, %eax
	movw	%ax, %cx # high 16 bits
	
	# 2
	pushw	%bx
	call	mp1_ioctl_list_search
	addl	$4, %esp
	
	cmpl	$FAILURE, %eax
	je		mp1_ioctl_sync_builtin_fail # can't find LOCATION
	movl	ptr, %edi
	
	# 1 
	pushw	%cx
	call	mp1_ioctl_list_search
	addl	$4, %esp

	cmpl	$FAILURE, %eax
	je		mp1_ioctl_sync_builtin_fail # can't find LOCATION
	movl	ptr, %esi
	
	# 1 -> (copy to) 2 (on length, off length, countdown, status)
	movw	ON_LENGTH(%esi), %ax
	movw	%ax, ON_LENGTH(%edi)
	movw	OFF_LENGTH(%esi), %ax
	movw	%ax, OFF_LENGTH(%edi)	
	movw	COUNTDOWN(%esi), %ax
	movw	%ax, COUNTDOWN(%edi)	
	movw	STATUS(%esi), %ax
	movw	%ax, STATUS(%edi)
	
	cmpw	$0, %ax
	je		mp1_ioctl_sync_builtin_offchar

mp1_ioctl_sync_builtin_onchar:
	movb 	ON_CHAR(%edi), %cl
	movl	$0, %eax
	movw 	LOCATION(%edi), %ax
	imulw 	$2, %ax

	call 	mp1_poke
	jmp		mp1_ioctl_sync_builtin_success
	
mp1_ioctl_sync_builtin_offchar:
	movb 	OFF_CHAR(%edi), %cl
	movl	$0, %eax
	movw 	LOCATION(%edi), %ax
	imulw 	$2, %ax

	call 	mp1_poke
	jmp 	mp1_ioctl_sync_builtin_success

mp1_ioctl_sync_builtin_fail:
	movl	$FAILURE, %eax
	jmp		mp1_global_exit

mp1_ioctl_sync_builtin_success:
	movl	$SUCCESS, %eax
	jmp		mp1_global_exit
	
/**************************IOCTL SYNC END**************************/



/**********************************************************************************/
/*                                                                                */
/*                               HELPER FUNCTIONS                                 */	
/*                                                                                */						
/**********************************************************************************/




// PROTOTYPE int32_t mp1_ioctl_list_search(int16_t location)
mp1_ioctl_list_search:
	enter 	$0, $0

	pushl	%esi
	pushl	%edi
	pushl	%ebx

	movl	mp1_list_head, %esi
	movw	8(%ebp), %ax # location -> %eax

	# no check is required outside the helper function
	cmpw	$0, %ax
	jb	mp1_ioctl_list_search_builtin_notfound
	cmpw	$1999, %ax
	ja	mp1_ioctl_list_search_builtin_notfound

mp1_ioctl_list_search_builtin_nextnode:
	cmpl	$0, %esi
	je	mp1_ioctl_list_search_builtin_notfound

	cmpw	LOCATION(%esi), %ax
	je	mp1_ioctl_list_search_builtin_found
	movl	%esi, %edi # use %edi to delay 1 node
	movl	NEXT(%esi), %esi
	jmp	mp1_ioctl_list_search_builtin_nextnode

mp1_ioctl_list_search_builtin_notfound:
	movl	$FAILURE, %eax
	jmp		mp1_global_exit

mp1_ioctl_list_search_builtin_found:
	movl	%edi, ptr_prev # store the previous pointer of the new pointer
	movl	%esi, ptr

	movl	$SUCCESS, %eax
	jmp		mp1_global_exit

/**************************LINKED LIST SEARCH END**************************/


/**************************GLOBAL EXIT START**************************/
mp1_global_exit:
	popl	%ebx
	popl	%edi
	popl	%esi
	leave
	ret

/**************************GLOBAL EXIT END**************************/

.end
