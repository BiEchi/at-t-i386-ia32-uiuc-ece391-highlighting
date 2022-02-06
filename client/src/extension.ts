/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
const vscode = require('vscode');

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('out', 'server', 'src','server.js')
	);
	
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	vscode.languages.registerHoverProvider('attasm', {
        provideHover(document, position, token) {

            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

			return hoverHandler(word);
        }
    });

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'attasm' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerattasm',
		'Language Server attasm',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function hoverHandler(word: string) {
	if (word == ".data") {
		return new vscode.Hover({
			language: "attasm",
			value: "Directive to represent data."
		});
	}
	if (word == ".text") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".globl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".global") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".end") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".byte") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".word") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".long") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".quad") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".int") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".ascii") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".asciz") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == ".align") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "addb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Add a number to a number, both with width 1 byte."
		});
	}
	if (word == "addw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Add a number to a number, both with width 2 bytes."
		});
	}
	if (word == "addl") {
		return new vscode.Hover({
			language: "attasm",
			value: "Add a number to a number, both with width 4 bytes."
		});
	}
	if (word == "addq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Add a number to a number, both with width 8 bytes."
		});
	}
	if (word == "subb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "subw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "subl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "subq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "negb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "negw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "negl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "negq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "incb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "incw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "incl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "incq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "decb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "decw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "decl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "decq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "mulb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "mulw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "mull") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "mulq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "divb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "divw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "divl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "divq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "imulb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "imulw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "imull") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "imulq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "idivb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "idivw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "idivl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "idivq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "cmpb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Subtract the SECOND argument with the FIRST argument, then set the sign flag according to the result. Both arguments should be width of byte 1."
		});
	}
	if (word == "cmpw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Subtract the SECOND argument with the FIRST argument, then set the sign flag according to the result. Both arguments should be width of byte 2."
		});
	}
	if (word == "cmpl") {
		return new vscode.Hover({
			language: "attasm",
			value: "Subtract the SECOND argument with the FIRST argument, then set the sign flag according to the result. Both arguments should be width of byte 4."
		});
	}
	if (word == "cmpq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Subtract the SECOND argument with the FIRST argument, then set the sign flag according to the result. Both arguments should be width of byte 8."
		});
	}
	if (word == "testb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "testw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "testl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "testq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "salb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left SIGNED numbers by 1 BIT (not byte!)."
		});
	}
	if (word == "salw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left SIGNED numbers by 2 BITs (not byte!)."
		});
	}
	if (word == "sall") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left SIGNED numbers by 4 BITs (not byte!)."
		});
	}
	if (word == "salq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left SIGNED numbers by 8 BITs (not byte!)."
		});
	}
	if (word == "shlb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left UNSIGNED numbers by 1 BIT (not byte!)."
		});
	}
	if (word == "shlw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left UNSIGNED numbers by 2 BITs (not byte!)."
		});
	}
	if (word == "shll") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left UNSIGNED numbers by 4 BITs (not byte!)."
		});
	}
	if (word == "shlq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Shift left UNSIGNED numbers by 8 BITs (not byte!)."
		});
	}
	if (word == "sarb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "sarw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "sarl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "sarq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "shrb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "shrw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "shrl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "shrq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rolb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rolw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "roll") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rolq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rorb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rorw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rorl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rorq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rclb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rclw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rcll") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rclq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rcrb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rcrw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rcrl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "rcrq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "notb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "notw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "notl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "notq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "andb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "andw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "andl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "andq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "orb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "orw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "orl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "orq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "xorb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "xorw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "xorl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "xorq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "movb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "movw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "movl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "movq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "leab") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "leaw") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "leal") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "leaq") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "pushb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Push a 2-byte (byte-length) number onto the running stack."
		});
	}
	if (word == "pushw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Push a 2-byte (word-length) number onto the running stack."
		});
	}
	if (word == "pushl") {
		return new vscode.Hover({
			language: "attasm",
			value: "Push a 4-byte (long-length) number onto the running stack."
		});
	}
	if (word == "pushq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Push a 8-byte (quad-length) number onto the running stack."
		});
	}
	if (word == "popb") {
		return new vscode.Hover({
			language: "attasm",
			value: "Pop the 1-byte-long number on top of the running stack to the argument register."
		});
	}
	if (word == "popw") {
		return new vscode.Hover({
			language: "attasm",
			value: "Pop the 2-byte-long number on top of the running stack to the argument register."
		});
	}
	if (word == "popl") {
		return new vscode.Hover({
			language: "attasm",
			value: "Pop the 4-byte-long number on top of the running stack to the argument register."
		});
	}
	if (word == "popq") {
		return new vscode.Hover({
			language: "attasm",
			value: "Pop the 8-byte-long number on top of the running stack to the argument register."
		});
	}
	if (word == "enter") {
		return new vscode.Hover({
			language: "attasm",
			value: "Equivalent to \npushl\t%ebp\nmovl\t%esp, %ebp\nOften used just after entering the calle function."
		});
	}
	if (word == "leave") {
		return new vscode.Hover({
			language: "attasm",
			value: "Equivalent to \nmovl\t%ebp, %esp\npopl\t%ebp\nOften used just before ret to leave the callee function or subroutine."
		});
	}
	if (word == "ret") {
		return new vscode.Hover({
			language: "attasm",
			value: "Equivalent to \nmovl\t(%esp), %eip\naddl\t$4, %esp\nOften used to indicate the end of the callee and return to caller."
		});
	}
	if (word == "loop") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "j") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jmp") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "ja") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jae") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jbe") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "je") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jg") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jge") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jle") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jna") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnae") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnb") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnbe") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jne") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jng") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnge") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnle") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jc") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jo") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jp") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jpe") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jpo") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "js") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jz") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnc") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jno") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnp") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jns") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jnz") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jcxz") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "jecxz") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "nop") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "xchg") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "call") {
		return new vscode.Hover({
			language: "attasm",
			value: "Equivalent to\npushl\t%eip, %eip\nmovl\tLEBEL_MEMORY_ADDRESS, %esp\nOften used to call a subroutine.\n[OTHER USAGE]\ncall *%eax\nis equivalent to\npush %eip\nmovl %eax, %eip\nand\ncall *(%eax)\nis equivalent to\npush %eip\nmovl (%eax), %eip"
		});
	}
	if (word == "int") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "eax") {
		return new vscode.Hover({
			language: "attasm",
			value: "Extended accumulative register."
		});
	}
	if (word == "ax") {
		return new vscode.Hover({
			language: "attasm",
			value: "Accumulative register."
		});
	}
	if (word == "al") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "ar") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "ebx") {
		return new vscode.Hover({
			language: "attasm",
			value: "Extended base register. Callee save register. Do NOT forget to push and pop it in the callee subroutine!"
		});
	}
	if (word == "bx") {
		return new vscode.Hover({
			language: "attasm",
			value: "Base register."
		});
	}
	if (word == "bl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "br") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "ecx") {
		return new vscode.Hover({
			language: "attasm",
			value: "Counter register."
		});
	}
	if (word == "cx") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "cl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "cr") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "edx") {
		return new vscode.Hover({
			language: "attasm",
			value: "Extended data register. Often used to be the second operand or temporary register for a functionality."
		});
	}
	if (word == "dx") {
		return new vscode.Hover({
			language: "attasm",
			value: "Data register."
		});
	}
	if (word == "dl") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "dr") {
		return new vscode.Hover({
			language: "attasm",
			value: ""
		});
	}
	if (word == "edi") {
		return new vscode.Hover({
			language: "attasm",
			value: "Extended destination index register. Callee save register. Do NOT forget to push and pop it in the callee subroutine!\nOften used to be a pointer for programmers use."
		});
	}
	if (word == "di") {
		return new vscode.Hover({
			language: "attasm",
			value: "Destination index register."
		});
	}
	if (word == "esi") {
		return new vscode.Hover({
			language: "attasm",
			value: "Extended source index register. Callee save register. Do NOT forget to push and pop it in the callee subroutine!\nOften used to be a pointer for programmers use."
		});
	}
	if (word == "si") {
		return new vscode.Hover({
			language: "attasm",
			value: "Source index register."
		});
	}
	if (word == "eip") {
		return new vscode.Hover({
			language: "attasm",
			value: "Global program counter. Identical to Program Counter (PC) in LC-3."
		});
	}
	if (word == "esp") {
		return new vscode.Hover({
			language: "attasm",
			value: "Global current stack pointer. Always points to the top of the running stack."
		});
	}
	if (word == "ebp") {
		return new vscode.Hover({
			language: "attasm",
			value: "Global base stack pointer. Always points to the base of the running stack FOR THE CURRENT SUBROUTINE (function)."
		});
	}
}
