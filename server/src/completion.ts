export enum OPNUM {
	DIRECTIVE_DATA,
	DIRECTIVE_TEXT,
	DIRECTIVE_GLOBL,
	DIRECTIVE_GLOBAL,
	DIRECTIVE_END,
	DIRECTIVE_BYTE,
	DIRECTIVE_WORD,
	DIRECTIVE_LONG,
	DIRECTIVE_QUAD,
	DIRECTIVE_INT,
	DIRECTIVE_ASCII,
	DIRECTIVE_ASCIZ,
	DIRECTIVE_ALIGN,
	ADDB,
	ADDW,
	ADDL,
	ADDQ,
	SUBB,
	SUBW,
	SUBL,
	SUBQ,
	NEGB,
	NEGW,
	NEGL,
	NEGQ,
	INCB,
	INCW,
	INCL,
	INCQ,
	DECB,
	DECW,
	DECL,
	DECQ,
	MULB,
	MULW,
	MULL,
	MULQ,
	DIVB,
	DIVW,
	DIVL,
	DIVQ,
	IMULB,
	IMULW,
	IMULL,
	IMULQ,
	IDIVB,
	IDIVW,
	IDIVL,
	IDIVQ,
	CMPB,
	CMPW,
	CMPL,
	CMPQ,
	TESTB,
	TESTW,
	TESTL,
	TESTQ,
	SALB,
	SALW,
	SALL,
	SALQ,
	SHLB,
	SHLW,
	SHLL,
	SHLQ,
	SARB,
	SARW,
	SARL,
	SARQ,
	SHRB,
	SHRW,
	SHRL,
	SHRQ,
	ROLB,
	ROLW,
	ROLL,
	ROLQ,
	RORB,
	RORW,
	RORL,
	RORQ,
	RCLB,
	RCLW,
	RCLL,
	RCLQ,
	RCRB,
	RCRW,
	RCRL,
	RCRQ,
	NOTB,
	NOTW,
	NOTL,
	NOTQ,
	ANDB,
	ANDW,
	ANDL,
	ANDQ,
	ORB,
	ORW,
	ORL,
	ORQ,
	XORB,
	XORW,
	XORL,
	XORQ,
	MOVB,
	MOVW,
	MOVL,
	MOVQ,
	LEAB,
	LEAW,
	LEAL,
	LEAQ,
	PUSHB,
	PUSHW,
	PUSHL,
	PUSHQ,
	POPB,
	POPW,
	POPL,
	POPQ,
	ENTER,
	LEAVE,
	RET,
	LOOP,
	J,
	JMP,
	JA,
	JAE,
	JB,
	JBE,
	JE,
	JG,
	JGE,
	JL,
	JLE,
	JNA,
	JNAE,
	JNB,
	JNBE,
	JNE,
	JNG,
	JNGE,
	JNL,
	JNLE,
	JC,
	JO,
	JP,
	JPE,
	JPO,
	JS,
	JZ,
	JNC,
	JNO,
	JNP,
	JNS,
	JNZ,
	JCXZ,
	JECXZ,
	NOP,
	XCHG,
	CALL,
	INT,
	EAX,
	AX,
	AL,
	AR,
	EBX,
	BX,
	BL,
	BR,
	ECX,
	CX,
	CL,
	CR,
	EDX,
	DX,
	DL,
	DR,
	EDI,
	DI,
	ESI,
	SI,
	EIP,
	ESP,
	EBP,
}




import {
	CompletionItem,
	CompletionItemKind,
} from 'vscode-languageserver';

import {
	Code,
} from './code';

import {
	INSTFLAG,
	Instruction,
	Label,
} from './instruction'

const defaultCompletionItems: CompletionItem[] = [
	{
		label: '.data',
		kind: CompletionItemKind.Property,
		data: OPNUM.DIRECTIVE_DATA
	},
	{
		label: '.text',
		kind: CompletionItemKind.Property,
		data: OPNUM.DIRECTIVE_TEXT
	},
	{
		label: '.globl',
		kind: CompletionItemKind.Property,
		data: OPNUM.DIRECTIVE_GLOBL
	},
	{
		label: '.global',
		kind: CompletionItemKind.Property,
		data: OPNUM.DIRECTIVE_GLOBAL
	},
	{
		label: '.end',
		kind: CompletionItemKind.Property,
		data: OPNUM.DIRECTIVE_END
	},
	{
		label: '.byte',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_BYTE
	},
	{
		label: '.word',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_WORD
	},
	{
		label: '.long',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_LONG
	},
	{
		label: '.quad',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_QUAD
	},
	{
		label: '.int',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_INT
	},
	{
		label: '.ascii',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_ASCII
	},
	{
		label: '.asciz',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_ASCIZ
	},
	{
		label: '.align',
		kind: CompletionItemKind.Enum,
		data: OPNUM.DIRECTIVE_ALIGN
	},
	{
		label: 'addb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ADDB
	},
	{
		label: 'addw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ADDW
	},
	{
		label: 'addl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ADDL
	},
	{
		label: 'addq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ADDQ
	},
	{
		label: 'subb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SUBB
	},
	{
		label: 'subw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SUBW
	},
	{
		label: 'subl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SUBL
	},
	{
		label: 'subq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SUBQ
	},
	{
		label: 'negb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NEGB
	},
	{
		label: 'negw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NEGW
	},
	{
		label: 'negl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NEGL
	},
	{
		label: 'negq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NEGQ
	},
	{
		label: 'incb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.INCB
	},
	{
		label: 'incw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.INCW
	},
	{
		label: 'incl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.INCL
	},
	{
		label: 'incq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.INCQ
	},
	{
		label: 'decb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DECB
	},
	{
		label: 'decw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DECW
	},
	{
		label: 'decl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DECL
	},
	{
		label: 'decq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DECQ
	},
	{
		label: 'mulb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.MULB
	},
	{
		label: 'mulw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.MULW
	},
	{
		label: 'mull',
		kind: CompletionItemKind.Operator,
		data: OPNUM.MULL
	},
	{
		label: 'mulq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.MULQ
	},
	{
		label: 'divb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DIVB
	},
	{
		label: 'divw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DIVW
	},
	{
		label: 'divl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DIVL
	},
	{
		label: 'divq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.DIVQ
	},
	{
		label: 'imulb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IMULB
	},
	{
		label: 'imulw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IMULW
	},
	{
		label: 'imull',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IMULL
	},
	{
		label: 'imulq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IMULQ
	},
	{
		label: 'idivb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IDIVB
	},
	{
		label: 'idivw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IDIVW
	},
	{
		label: 'idivl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IDIVL
	},
	{
		label: 'idivq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.IDIVQ
	},
	{
		label: 'cmpb',
		kind: CompletionItemKind.Function,
		data: OPNUM.CMPB
	},
	{
		label: 'cmpw',
		kind: CompletionItemKind.Function,
		data: OPNUM.CMPW
	},
	{
		label: 'cmpl',
		kind: CompletionItemKind.Function,
		data: OPNUM.CMPL
	},
	{
		label: 'cmpq',
		kind: CompletionItemKind.Function,
		data: OPNUM.CMPQ
	},
	{
		label: 'testb',
		kind: CompletionItemKind.Function,
		data: OPNUM.TESTB
	},
	{
		label: 'testw',
		kind: CompletionItemKind.Function,
		data: OPNUM.TESTW
	},
	{
		label: 'testl',
		kind: CompletionItemKind.Function,
		data: OPNUM.TESTL
	},
	{
		label: 'testq',
		kind: CompletionItemKind.Function,
		data: OPNUM.TESTQ
	},
	{
		label: 'salb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SALB
	},
	{
		label: 'salw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SALW
	},
	{
		label: 'sall',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SALL
	},
	{
		label: 'salq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SALQ
	},
	{
		label: 'shlb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHLB
	},
	{
		label: 'shlw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHLW
	},
	{
		label: 'shll',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHLL
	},
	{
		label: 'shlq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHLQ
	},
	{
		label: 'sarb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SARB
	},
	{
		label: 'sarw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SARW
	},
	{
		label: 'sarl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SARL
	},
	{
		label: 'sarq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SARQ
	},
	{
		label: 'shrb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHRB
	},
	{
		label: 'shrw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHRW
	},
	{
		label: 'shrl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHRL
	},
	{
		label: 'shrq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.SHRQ
	},
	{
		label: 'rolb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ROLB
	},
	{
		label: 'rolw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ROLW
	},
	{
		label: 'roll',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ROLL
	},
	{
		label: 'rolq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ROLQ
	},
	{
		label: 'rorb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RORB
	},
	{
		label: 'rorw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RORW
	},
	{
		label: 'rorl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RORL
	},
	{
		label: 'rorq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RORQ
	},
	{
		label: 'rclb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCLB
	},
	{
		label: 'rclw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCLW
	},
	{
		label: 'rcll',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCLL
	},
	{
		label: 'rclq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCLQ
	},
	{
		label: 'rcrb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCRB
	},
	{
		label: 'rcrw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCRW
	},
	{
		label: 'rcrl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCRL
	},
	{
		label: 'rcrq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.RCRQ
	},
	{
		label: 'notb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NOTB
	},
	{
		label: 'notw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NOTW
	},
	{
		label: 'notl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NOTL
	},
	{
		label: 'notq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.NOTQ
	},
	{
		label: 'andb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ANDB
	},
	{
		label: 'andw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ANDW
	},
	{
		label: 'andl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ANDL
	},
	{
		label: 'andq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ANDQ
	},
	{
		label: 'orb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ORB
	},
	{
		label: 'orw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ORW
	},
	{
		label: 'orl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ORL
	},
	{
		label: 'orq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.ORQ
	},
	{
		label: 'xorb',
		kind: CompletionItemKind.Operator,
		data: OPNUM.XORB
	},
	{
		label: 'xorw',
		kind: CompletionItemKind.Operator,
		data: OPNUM.XORW
	},
	{
		label: 'xorl',
		kind: CompletionItemKind.Operator,
		data: OPNUM.XORL
	},
	{
		label: 'xorq',
		kind: CompletionItemKind.Operator,
		data: OPNUM.XORQ
	},
	{
		label: 'movb',
		kind: CompletionItemKind.Function,
		data: OPNUM.MOVB
	},
	{
		label: 'movw',
		kind: CompletionItemKind.Function,
		data: OPNUM.MOVW
	},
	{
		label: 'movl',
		kind: CompletionItemKind.Function,
		data: OPNUM.MOVL
	},
	{
		label: 'movq',
		kind: CompletionItemKind.Function,
		data: OPNUM.MOVQ
	},
	{
		label: 'leab',
		kind: CompletionItemKind.Function,
		data: OPNUM.LEAB
	},
	{
		label: 'leaw',
		kind: CompletionItemKind.Function,
		data: OPNUM.LEAW
	},
	{
		label: 'leal',
		kind: CompletionItemKind.Function,
		data: OPNUM.LEAL
	},
	{
		label: 'leaq',
		kind: CompletionItemKind.Function,
		data: OPNUM.LEAQ
	},
	{
		label: 'pushb',
		kind: CompletionItemKind.Event,
		data: OPNUM.PUSHB
	},
	{
		label: 'pushw',
		kind: CompletionItemKind.Event,
		data: OPNUM.PUSHW
	},
	{
		label: 'pushl',
		kind: CompletionItemKind.Event,
		data: OPNUM.PUSHL
	},
	{
		label: 'pushq',
		kind: CompletionItemKind.Event,
		data: OPNUM.PUSHQ
	},
	{
		label: 'popb',
		kind: CompletionItemKind.Event,
		data: OPNUM.POPB
	},
	{
		label: 'popw',
		kind: CompletionItemKind.Event,
		data: OPNUM.POPW
	},
	{
		label: 'popl',
		kind: CompletionItemKind.Event,
		data: OPNUM.POPL
	},
	{
		label: 'popq',
		kind: CompletionItemKind.Event,
		data: OPNUM.POPQ
	},
	{
		label: 'enter',
		kind: CompletionItemKind.Event,
		data: OPNUM.ENTER
	},
	{
		label: 'leave',
		kind: CompletionItemKind.Event,
		data: OPNUM.LEAVE
	},
	{
		label: 'ret',
		kind: CompletionItemKind.Event,
		data: OPNUM.RET
	},
	{
		label: 'loop',
		kind: CompletionItemKind.Event,
		data: OPNUM.LOOP
	},
	{
		label: 'j',
		kind: CompletionItemKind.Event,
		data: OPNUM.J
	},
	{
		label: 'jmp',
		kind: CompletionItemKind.Event,
		data: OPNUM.JMP
	},
	{
		label: 'ja',
		kind: CompletionItemKind.Event,
		data: OPNUM.JA
	},
	{
		label: 'jae',
		kind: CompletionItemKind.Event,
		data: OPNUM.JAE
	},
	{
		label: 'jb',
		kind: CompletionItemKind.Event,
		data: OPNUM.JB
	},
	{
		label: 'jbe',
		kind: CompletionItemKind.Event,
		data: OPNUM.JBE
	},
	{
		label: 'je',
		kind: CompletionItemKind.Event,
		data: OPNUM.JE
	},
	{
		label: 'jg',
		kind: CompletionItemKind.Event,
		data: OPNUM.JG
	},
	{
		label: 'jge',
		kind: CompletionItemKind.Event,
		data: OPNUM.JGE
	},
	{
		label: 'jl',
		kind: CompletionItemKind.Event,
		data: OPNUM.JL
	},
	{
		label: 'jle',
		kind: CompletionItemKind.Event,
		data: OPNUM.JLE
	},
	{
		label: 'jna',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNA
	},
	{
		label: 'jnae',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNAE
	},
	{
		label: 'jnb',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNB
	},
	{
		label: 'jnbe',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNBE
	},
	{
		label: 'jne',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNE
	},
	{
		label: 'jng',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNG
	},
	{
		label: 'jnge',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNGE
	},
	{
		label: 'jnl',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNL
	},
	{
		label: 'jnle',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNLE
	},
	{
		label: 'jc',
		kind: CompletionItemKind.Event,
		data: OPNUM.JC
	},
	{
		label: 'jo',
		kind: CompletionItemKind.Event,
		data: OPNUM.JO
	},
	{
		label: 'jp',
		kind: CompletionItemKind.Event,
		data: OPNUM.JP
	},
	{
		label: 'jpe',
		kind: CompletionItemKind.Event,
		data: OPNUM.JPE
	},
	{
		label: 'jpo',
		kind: CompletionItemKind.Event,
		data: OPNUM.JPO
	},
	{
		label: 'js',
		kind: CompletionItemKind.Event,
		data: OPNUM.JS
	},
	{
		label: 'jz',
		kind: CompletionItemKind.Event,
		data: OPNUM.JZ
	},
	{
		label: 'jnc',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNC
	},
	{
		label: 'jno',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNO
	},
	{
		label: 'jnp',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNP
	},
	{
		label: 'jns',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNS
	},
	{
		label: 'jnz',
		kind: CompletionItemKind.Event,
		data: OPNUM.JNZ
	},
	{
		label: 'jcxz',
		kind: CompletionItemKind.Event,
		data: OPNUM.JCXZ
	},
	{
		label: 'jecxz',
		kind: CompletionItemKind.Event,
		data: OPNUM.JECXZ
	},
	{
		label: 'nop',
		kind: CompletionItemKind.Event,
		data: OPNUM.NOP
	},
	{
		label: 'xchg',
		kind: CompletionItemKind.Event,
		data: OPNUM.XCHG
	},
	{
		label: 'call',
		kind: CompletionItemKind.Event,
		data: OPNUM.CALL
	},
	{
		label: 'int',
		kind: CompletionItemKind.Event,
		data: OPNUM.INT
	},
	{
		label: 'eax',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EAX
	},
	{
		label: 'ax',
		kind: CompletionItemKind.Variable,
		data: OPNUM.AX
	},
	{
		label: 'al',
		kind: CompletionItemKind.Variable,
		data: OPNUM.AL
	},
	{
		label: 'ar',
		kind: CompletionItemKind.Variable,
		data: OPNUM.AR
	},
	{
		label: 'ebx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EBX
	},
	{
		label: 'bx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.BX
	},
	{
		label: 'bl',
		kind: CompletionItemKind.Variable,
		data: OPNUM.BL
	},
	{
		label: 'br',
		kind: CompletionItemKind.Variable,
		data: OPNUM.BR
	},
	{
		label: 'ecx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.ECX
	},
	{
		label: 'cx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.CX
	},
	{
		label: 'cl',
		kind: CompletionItemKind.Variable,
		data: OPNUM.CL
	},
	{
		label: 'cr',
		kind: CompletionItemKind.Variable,
		data: OPNUM.CR
	},
	{
		label: 'edx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EDX
	},
	{
		label: 'dx',
		kind: CompletionItemKind.Variable,
		data: OPNUM.DX
	},
	{
		label: 'dl',
		kind: CompletionItemKind.Variable,
		data: OPNUM.DL
	},
	{
		label: 'dr',
		kind: CompletionItemKind.Variable,
		data: OPNUM.DR
	},
	{
		label: 'edi',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EDI
	},
	{
		label: 'di',
		kind: CompletionItemKind.Variable,
		data: OPNUM.DI
	},
	{
		label: 'esi',
		kind: CompletionItemKind.Variable,
		data: OPNUM.ESI
	},
	{
		label: 'si',
		kind: CompletionItemKind.Variable,
		data: OPNUM.SI
	},
	{
		label: 'eip',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EIP
	},
	{
		label: 'esp',
		kind: CompletionItemKind.Variable,
		data: OPNUM.ESP
	},
	{
		label: 'ebp',
		kind: CompletionItemKind.Variable,
		data: OPNUM.EBP
	},
];

// To be sent to the server
export let completionItems: CompletionItem[];

// Update completion item list according to the label names
export function updateCompletionItems(code: Code) {
	completionItems = [...defaultCompletionItems];
	let i: number;
	let label: Label;
	let instruction: Instruction;
	let item: CompletionItem;
	// Push labels
	for (let idx = 0; idx < code.labels.length; idx++) {
		label = code.labels[idx];
		item = { label: label.name, kind: CompletionItemKind.Text, data: label.line };
		for (i = 0; i < completionItems.length; i++) {
			if (completionItems[i].label == label.name) {
				break;
			}
		}
		if (i == completionItems.length) {
			completionItems.push(item);
		}
	}
	// Push labels in instructions
	for (let idx = 0; idx < code.instructions.length; idx++) {
		instruction = code.instructions[idx];
		if (!(instruction.flags & INSTFLAG.isIncomplete) && instruction.isMemType()) {
			item = { label: instruction.mem, kind: CompletionItemKind.Text, data: instruction.line };
			for (i = 0; i < completionItems.length; i++) {
				if (completionItems[i].label == instruction.mem) {
					break;
				}
			}
			if (i == completionItems.length) {
				completionItems.push(item);
			}
		}
	}
}
