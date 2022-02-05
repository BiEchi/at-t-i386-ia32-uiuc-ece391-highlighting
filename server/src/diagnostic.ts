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

// For code action
export const MESSAGE_POSSIBLE_SUBROUTINE = "Label is never used.";

export function generateDiagnostics(diagnosticInfo: DiagnosticInfo, code: Code) {
	let instruction: Instruction;
	// the document is empty or full of comment
	if (code.instructions.length == 0) {
		return;
	}

	/** LINE checking */
	for (let idx = 0; idx < code.instructions.length; idx++) {
		instruction = code.instructions[idx];

		// Skip the instruction if it is not found
		if (!(instruction.flags & INSTFLAG.isFound)) {
			continue;
		}

		// Check for incomplete/illegal instructions
		if (diagnosticInfo.settings.showIllegalInstructions && (instruction.flags & INSTFLAG.isIncomplete)) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Illegal or incomplete instruction.", instruction.line,
				instruction.rawString + " is incomplete/illegal");
			continue;
		}

		// Check for dead code
		if ((instruction.flags & INSTFLAG.isDead)) {
			generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Hint, [DiagnosticTag.Unnecessary], "Dead code.", instruction.line,
				"Overwriting the value in R" + instruction.dest + " without using it.");
		}

		// Checking each line of code based on operation type
		switch (instruction.optype) {
			case OPTYPE.arithmeticOperation:
				if (instruction.immVal >= 2147483647 || instruction.immVal < -2147483646) {
					generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Error, [], "Immediate value is out of range.", instruction.line, "");
				} else if (instruction.immValType == '#' && instruction.immVal >= 16) {
					generateDiagnostic(diagnosticInfo, DiagnosticSeverity.Warning, [], "Immediate value is out of range.", instruction.line,
						"The maximum positive immediate value allowed is 15 (x000F). The number you put here will be interpreted as a negative number.");
				}
				break;
			default:
				break;
		}
	}
}


// Generate and push a diagnostic into diagnostics array
function generateDiagnostic(diagnosticInfo: DiagnosticInfo, severity: DiagnosticSeverity, tags: DiagnosticTag[], message: string, line: number, relatedInfo: string, length?: number) {
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
		source: "AT&T x86_32 Assembly",
		tags: tags
	};
	// Pass related info
	// if (relatedInfo && hasDiagnosticRelatedInformationCapability) {
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
	// Optionally push diagnostics
	if ((diagnostic.severity == DiagnosticSeverity.Warning && diagnosticInfo.settings.showWarnings) ||
		(diagnostic.severity == DiagnosticSeverity.Error && diagnosticInfo.settings.showErrors) ||
		diagnostic.severity == DiagnosticSeverity.Information ||
		diagnostic.severity == DiagnosticSeverity.Hint) {
		diagnosticInfo.diagnostics.push(diagnostic);
	}
}
