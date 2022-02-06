import {
	Diagnostic,
	DiagnosticTag,
	DiagnosticSeverity,
} from 'vscode-languageserver';

import {
	DiagnosticInfo,
} from './server';

import {
	Code,
} from './code';

import {
	OPTYPE,
	Instruction,
	Label,
	isAttasmNum,
	isAttasmReg,
	INSTFLAG,
	CC,
} from './instruction'


export enum REGTYPE {
	REG_L,
	REG_R,
	REG_X,
	REG_E,
};

import {
	BasicBlock,
	BBFLAG,
	REGFLAG,
	REGSTAT,
} from "./basicBlock";

enum MATCHPATTERN {
	NONE = 0x0,
	IMM_EQDIFF = 0x1,
	IMM_DOUBLE = 0x2,
	IMM_HALF = 0x4,
	MEM_EQDIFF = 0x8,
}

// For code action.
export function generateDiagnostics(diagnosticInfo: DiagnosticInfo, code: Code) {
	let instruction: Instruction;
	// the document is empty or full of comment
	if (code.instructions.length == 0) {
		return;
	}
	
	/** LINE checking */
	for (let idx = 0; idx < code.instructions.length; idx++) {
		instruction = code.instructions[idx];

		// Check for code before .data directive
		if (code.dataLine > instruction.line) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Instruction before start of program", instruction.line,
				"Please double check whether this line is after the .data directive.");
			continue;
		}

		// Check for code after .end directive
		if (code.endLine < instruction.line) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Instruction after end of program", instruction.line,
				"Please double check whether this line is after the .end directive.");
			continue;
		}

		// Check for commands in the .data section
		if (code.dataLine < instruction.line && instruction.line < code.textLine && (
			instruction.optype == OPTYPE.aloneOperation || instruction.optype == OPTYPE.arithmeticOperation ||
			instruction.optype == OPTYPE.controlOperation || instruction.optype == OPTYPE.moveOperation)) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Instruction in the data section.", instruction.line,
				"The compiler can't recognize your commands in the data section. Only put memory here!");
			continue;
		}

		// Check for data in the .text section
		if (instruction.line > code.textLine && instruction.line < code.endLine && (
			instruction.optype == OPTYPE.directiveData || instruction.optype == OPTYPE.directiveNumber ||
			instruction.optype == OPTYPE.directiveString)) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Data in the text section.", instruction.line,
				"The compiler can't recognize your data in the code (.text) section. Only put commands here!");
			continue;
		}

		// Check for instructions out of existance
		if (code.textLine < instruction.line && instruction.flags & INSTFLAG.DNE) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Instruction doesn't exist or out of course scope.", instruction.line,
				instruction.rawString + " cannot be found in the course handbook.");
			continue;
		}

		// The number of arguments is wrong
		if (instruction.flags & INSTFLAG.argumentNumberInvalid) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "The argument number in the instruction is not correct.", instruction.line,
				"The instruction has too many or too few arguments. Return to the course notes!");
			continue;
		}

		// Real number out of range
		if (instruction.optype & OPTYPE.arithmeticOperation) {
			if (instruction.immVal >= 2147483647 || instruction.immVal < -2147483646) {
				generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Immediate value is out of range.", instruction.line, "");
			}
			continue;
		}

		// The datatype of command does not match the registers
		if (instruction.optype == OPTYPE.arithmeticOperation || instruction.optype == OPTYPE.stackOperation) {
			let invalidFlag: boolean = false;
			let srcReg: string = instruction.src, destReg: string = instruction.dest;
			
			switch (instruction.name.charAt(instruction.name.length-1)) {
				case "b":
					if ( (destReg && !destReg.match(/[rl]$/)) || (srcReg && !srcReg.match(/[rl]$/)) ) {
						invalidFlag = true;
					}
					break;
				case "w":
					if ( (destReg && !destReg.match(/^(ax|bx|cx|dx|di|si)$/)) || (srcReg && !srcReg.match(/^(ax|bx|cx|dx|di|si)$/)) ) {
						invalidFlag = true;
					}
					break;
				case "l":
					if ( (destReg && !destReg.match(/^(eax|ebx|ecx|edx|edi|esi|eip|ebp|esp)$/)) || (srcReg && !srcReg.match(/^(eax|ebx|ecx|edx|edi|esi|eip|ebp|esp)$/)) ) {
						invalidFlag = true;
					}
					break;
				case "q":
					generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Illegal instruction length", instruction.line, 
					"In ECE391, we don't support Quadword datatype (64 bit). Please convert your data into 2 pieces of 32-bits.");
					break;
				default:
					break;
			}
			if (invalidFlag == true) {
				generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Instruction type different from register type", instruction.line, 
					"The instrction " + instruction.name + " does not match the data in their lengths. E.g., movl %ax, %bx is wrong.");
			}
		}

		// Both arguments are memory
		if (instruction.flags & INSTFLAG.useMemoryTwice) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Two arguments are memory(label) at the same time.", instruction.line,
				"You can't use memory for both argument. This is not only slow but also too complicated for a compiler to manage.");
		}

		// Immediate value without '$'
		if (instruction.flags & INSTFLAG.numberWithoutSymbol) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "An immediate number must be led with a $", instruction.line,
				"All immediate values must have $ at its very beginning. Only for memory displacement can you use a number without $.");
		}

		// Register without '%'
		if (instruction.flags & INSTFLAG.registerWithoutSymbol) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "An register must be led with a %", instruction.line,
				"All registers must have % at its very beginning.");
		}
	}

	/* Block Checking */
	// Alignment issues
	

}


// Generate and push a diagnostic into diagnostics array
export function generateDiagnostic(diagnosticInfo: DiagnosticInfo, severity: DiagnosticSeverity, tags: DiagnosticTag[], message: string, line: number, relatedInfo: string, length?: number) {
	if (length == undefined) {
		length = 1;
	}
	// Build a diagnostic
	const diagnostic: Diagnostic = {
		severity: severity,
		range: {
			start: { line: line, character: 0 },
			end: { line: line + length, character: 0 }
		},
		message: message,
		source: "Prof. Lumetta blesses you!",
		tags: tags
	};
	// Pass related info
	if (relatedInfo) {
		diagnostic.relatedInformation = [
			{
				location: {
					uri: diagnosticInfo.textDocument.uri,
					range: Object.assign({}, diagnostic.range)
				},
				message: relatedInfo
			}
		];
	}
	// Push diagnostics
	diagnosticInfo.diagnostics.push(diagnostic);
}
