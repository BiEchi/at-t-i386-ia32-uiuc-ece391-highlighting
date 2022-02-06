export enum BBFLAG {
	none = 0x0,
	hasExplored = 0x1,
	hasCheckedBackward = 0x2,
	hasCheckedForward = 0x4,
	hasChange = 0x8,
	hasBR = 0x10,
	hasSetCC = 0x20,
}

import {
	CC,
	INSTFLAG,
	Instruction,
} from './instruction'

export enum REGFLAG {
	none = 0x0,
	S = 0x1,				// Saved
	R = 0x2,				// Restored
	SR = 0x3,				// Saved and Restored
	INPUT = 0x4, 		// Not initialized before used
}

export enum REGSTAT {
	none = 0x0,	// Not used
	W = 0x1,		// Last written
	R = 0x2,		// Last read
	RW = 0x3,		// Last read and written
}

export class BasicBlock {
	public instructions: Instruction[] = []; 				// Instruction at the same memory address
	public subroutineNum: number = NaN;					  	// Subroutine ID
	public overlapNumber: number = NaN;						// Subroutine ID of the other subroutine, if any
	public nextBlock: BasicBlock | null = null;   			// Next block pointer
	public brBlock: BasicBlock | null = null;		  		// Branch block pointer
	public exitBlock: BasicBlock[] = [];  					// Exit blocks of a subroutine, only valid for subroutine start blocks
	public flags: number = BBFLAG.none;						// Flags - see BBFLAG structure definition
	public registers: Registers = new Registers;			// Registers
	public cc: CC = CC.none; 								// CC, see CC definition in instruction.ts. 1 means the CC is possible to appear in the condition code
	public initialCC: CC = CC.none; 						// Initial CC, 1 means the CC is possible to appear in the condition code

	constructor() {
	}

	// Push an instruction into the basic block
	public pushInstruction(instruction: Instruction) {
		if (this.instructions.length == 0) {
			this.subroutineNum = instruction.subroutineNum;
		}
		this.instructions.push(instruction);
	}

	// Check for dead code in this block
	public analyzeBackward(bb: BasicBlock): Array<REGSTAT> {
		let regstat1 = null;
		let regstat2 = null;

		if (this.flags & BBFLAG.hasCheckedBackward) {
			return this.registers.getStats();
		}
		this.flags |= BBFLAG.hasCheckedBackward;

		// Get regstat from next blocks, merge them
		if (this.nextBlock) {
			regstat1 = this.nextBlock.analyzeBackward(bb);
			for (let i = 0; i < 8; i++) {
				this.registers.regs[i].status |= regstat1[i];
			}
		}
		if (this.brBlock) {
			// On backward branches, don't make any assumptions
			if (this.brBlock.flags & BBFLAG.hasCheckedBackward) {
				regstat2 = [REGSTAT.RW, REGSTAT.RW, REGSTAT.RW, REGSTAT.RW,
				REGSTAT.RW, REGSTAT.RW, REGSTAT.RW, REGSTAT.RW, REGSTAT.RW,];
			} else {
				regstat2 = this.brBlock.analyzeBackward(bb);
			}
			for (let i = 0; i < 8; i++) {
				this.registers.regs[i].status |= regstat2[i];
			}
		}

		this.analyzeInstructionsBackward(bb);
		return this.registers.getStats();
	}

	private analyzeInstructionsBackward(bb: BasicBlock) {
		let instruction: Instruction;

		// Iterate backward
		for (let idx = this.instructions.length - 1; idx >= 0; idx--) {
			
		
		}
	}

	// Check CC possibility in this block
	public analyzeForward(preCC: number): number {
		let instruction: Instruction;

		// If initial CC didn't change, return immediately
		if (preCC == (this.initialCC & preCC)) {
			return this.flags & BBFLAG.hasChange;
		}

		// Merge cc
		this.initialCC |= preCC;

		// Iterate through instructions
		this.cc = this.initialCC;
		for (let i = 0; i < this.instructions.length; i++) {
			instruction = this.instructions[i];
			// Reset CC possiblity
		}
	}
}

class Register {
	public value: number = NaN;
	public status: REGSTAT = REGSTAT.none;
	public flag: REGFLAG = REGFLAG.none;
	public savedMem: string = "";
	public restoredMem: string = "";
	constructor() { }
}

class Registers {
	public regs: Register[] = [];

	constructor() {
		for (let i = 0; i < 9; i++) {
			this.regs.push(new Register());
		}
	}

	public getStats(): Array<REGSTAT> {
		let arr: Array<REGSTAT> = [];
		for (let i = 0; i < 9; i++) {
			arr.push(this.regs[i].status);
		}
		return arr;
	}

	public getFlags(): Array<REGFLAG> {
		let arr: Array<REGFLAG> = [];
		for (let i = 0; i < 9; i++) {
			arr.push(this.regs[i].flag);
		}
		return arr;
	}

	public getSavedMem(): Array<string> {
		let arr: Array<string> = [];
		for (let i = 0; i < 9; i++) {
			arr.push(this.regs[i].savedMem);
		}
		return arr;
	}

	public getRestoredMem(): Array<string> {
		let arr: Array<string> = [];
		for (let i = 0; i < 9; i++) {
			arr.push(this.regs[i].restoredMem);
		}
		return arr;
	}
}
