// top-level entity

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  CodeActionParams,
  CodeAction,
  CodeActionKind,
  DiagnosticSeverity,
  DeclarationParams,
  Location,
  InsertTextFormat,
} from 'vscode-languageserver';

import {
  TextDocument,
} from 'vscode-languageserver-textdocument';

import {
  generateDiagnostics,
  MESSAGE_POSSIBLE_SUBROUTINE,
} from './diagnostic';

import {
  OPNUM,
  completionItems,
  updateCompletionItems,
} from './completion';

import {
  Label,
} from './instruction'

import {
  Code,
} from './code';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
export let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true
      },
      codeActionProvider: true,
      definitionProvider: true
    }
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

export interface ExtensionSettings {
  version: string;
  showWarnings: boolean;
  showErrors: boolean;
  showIllegalInstructions: boolean;
  enableSubroutineChecking: boolean;
  enableUnrolledLoopChecking: boolean;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExtensionSettings = {
  version: 'v2',
  showWarnings: true,
  showErrors: true,
  showIllegalInstructions: false,
  enableSubroutineChecking: true,
  enableUnrolledLoopChecking: true,
};
let globalSettings: ExtensionSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExtensionSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ExtensionSettings>(
      (change.settings.LC3 || defaultSettings)
    );
  }

  // Revalidate all open text documents
  const docs = documents.all();
  for (let i = 0; i < docs.length; i++) {
    const code = new Code(docs[i].getText());
    validateTextDocument(docs[i], code);
  }
});

export function getDocumentSettings(resource: string): Thenable<ExtensionSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'LC3'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

let LabelList: Label[];

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  // URI have more info?
  // change.document.uri
  const code = new Code(change.document.getText());
  validateTextDocument(change.document, code);
  updateCompletionItems(code);
  LabelList = code.labels; // refresh the label list 
});

// Simplify the interface
export interface DiagnosticInfo {
  textDocument: TextDocument;
  diagnostics: Diagnostic[];
  settings: ExtensionSettings;
}

export async function validateTextDocument(textDocument: TextDocument, code: Code): Promise<void> {
  // Get the settings of the document
  const settings = await getDocumentSettings(textDocument.uri);
  const diagnostics: Diagnostic[] = [];
  const diagnosticInfo: DiagnosticInfo = {
    textDocument: textDocument,
    diagnostics: diagnostics, // linter
    settings: settings
  };

  // Generate diagnostics
  generateDiagnostics(diagnosticInfo, code);
  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCodeAction(provideCodeActions);
export function provideCodeActions(parms: CodeActionParams): CodeAction[] {
  // Check if document was correctly returned
  const document = documents.get(parms.textDocument.uri);
  if (!document) {
    return [];
  }

  // Check if diagnostics is non-empty
  const diagnostics = parms.context.diagnostics;
  if (!(diagnostics) || diagnostics.length == 0) {
    return [];
  }

  // Find the diagnostics with unused label
  const codeActions: CodeAction[] = [];
  diagnostics.forEach((diag) => {
    if (diag.severity === DiagnosticSeverity.Hint && diag.message.includes(MESSAGE_POSSIBLE_SUBROUTINE)) {
      codeActions.push({
        title: "Insert a mark to indicate this is a subroutine",
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [parms.textDocument.uri]: [{
              range: { start: diag.range.start, end: diag.range.start },
              newText: "; @SUBROUTINE\n"
            }]
          }
        }
      });
      return;
    }
  });
  return codeActions;
}

// Returns the completion list for the request
connection.onCompletion(provideCompletion);
export function provideCompletion(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
  completionItems.forEach(item => {
    // Remove item on the current line
    if (item.data === textDocumentPosition.position.line) {
      completionItems.splice(completionItems.indexOf(item), 1);
    }
  });
  return completionItems;
}

connection.onDefinition(provideDefinition);
export function provideDefinition(params: DeclarationParams): Location | undefined {
  let doc = documents.get(params.textDocument.uri);
  if (doc == undefined) {
    return undefined;
  }
  let docstr: string = doc.getText();

  // Get the start and end point of current label
  let offset: number = doc.offsetAt(params.position);
  let start: number = offset, end: number = offset;
  while (start > 0 && isAlphaNumeric(docstr[start - 1])) {
    start--;
  }
  // point end to the last line of file
  while (isAlphaNumeric(docstr[end])) {
    end++;
  }
  let name: string = docstr.substring(start, end);
  for (let idx = 0; idx < LabelList.length; idx++) {
    let label: Label = LabelList[idx];
    if (name == label.name) {
      return { uri: params.textDocument.uri, range: { start: { line: label.line, character: 0 }, end: { line: label.line + 1, character: 0 } } };
    }
  }
}

// determine whether a character is alpha/number
function isAlphaNumeric(ch: string) {
  return ch.match(/\w/);
}

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(provideCompletionResolve);
export function provideCompletionResolve(item: CompletionItem): CompletionItem {
  if (item.data === OPNUM.DIRECTIVE_DATA) {
		item.detail = 'Declare the block to place memory.';
		item.insertText = 'data';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Code written in the .data section is forbidden.\nYou must only place memory in this part.';
	}
	else if (item.data === OPNUM.DIRECTIVE_TEXT) {
		item.detail = 'Declare the block to place code.';
		item.insertText = 'text';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Declare the end of .data section and start of code section.\nAll code should be pleaced here.';
	}
	else if (item.data === OPNUM.DIRECTIVE_GLOBL) {
		item.detail = 'Alias of .global directive.';
		item.insertText = 'globl\t${1:label}';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = '';
	}
	else if (item.data === OPNUM.DIRECTIVE_GLOBAL) {
		item.detail = 'Declare the export of a subroutine.';
		item.insertText = 'global\t{$1:label}';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Export the subroutine to the caller, most commonly a C program.';
	}
	else if (item.data === OPNUM.DIRECTIVE_END) {
		item.detail = 'Declare the end of the code section.';
		item.insertText = 'end';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Used to declare the end of code section (and all code).\nYou can NOT write any more code after this directive.';
	}
	else if (item.data === OPNUM.DIRECTIVE_BYTE) {
		item.detail = 'byte Data Declare';
		item.insertText = 'byte\t${1:byte_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_WORD) {
		item.detail = 'word Data Declare';
		item.insertText = 'word\t${1:word_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_LONG) {
		item.detail = 'long Data Declare';
		item.insertText = 'long\t${1:long_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_QUAD) {
		item.detail = 'quad Data Declare';
		item.insertText = 'quad\t${1:quad_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_INT) {
		item.detail = 'int Data Declare';
		item.insertText = 'int\t${1:int_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_ASCII) {
		item.detail = 'ascii Data Declare';
		item.insertText = 'ascii\t${1:ascii_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_ASCIZ) {
		item.detail = 'asciz Data Declare';
		item.insertText = 'asciz\t${1:asciz_data}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIRECTIVE_ALIGN) {
		item.detail = 'align Memory Alignment';
		item.insertText = 'align\t${1:.byte=1,.int=2,.long=4,.quad=8}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ADDB) {
		item.detail = 'addb Arthmetic Operation';
		item.insertText = 'addb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ADDW) {
		item.detail = 'addw Arthmetic Operation';
		item.insertText = 'addw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ADDL) {
		item.detail = 'addl Arthmetic Operation';
		item.insertText = 'addl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ADDQ) {
		item.detail = 'addq Arthmetic Operation';
		item.insertText = 'addq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SUBB) {
		item.detail = 'subb Arthmetic Operation';
		item.insertText = 'subb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SUBW) {
		item.detail = 'subw Arthmetic Operation';
		item.insertText = 'subw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SUBL) {
		item.detail = 'subl Arthmetic Operation';
		item.insertText = 'subl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SUBQ) {
		item.detail = 'subq Arthmetic Operation';
		item.insertText = 'subq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NEGB) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NEGW) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NEGL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NEGQ) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.INCB) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.INCW) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.INCL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.INCQ) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DECB) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DECW) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DECL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DECQ) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MULB) {
		item.detail = 'mulb Arthmetic Operation';
		item.insertText = 'mulb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MULW) {
		item.detail = 'mulw Arthmetic Operation';
		item.insertText = 'mulw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MULL) {
		item.detail = 'mull Arthmetic Operation';
		item.insertText = 'mull\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MULQ) {
		item.detail = 'mulq Arthmetic Operation';
		item.insertText = 'mulq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIVB) {
		item.detail = 'divb Arthmetic Operation';
		item.insertText = 'divb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIVW) {
		item.detail = 'divw Arthmetic Operation';
		item.insertText = 'divw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIVL) {
		item.detail = 'divl Arthmetic Operation';
		item.insertText = 'divl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DIVQ) {
		item.detail = 'divq Arthmetic Operation';
		item.insertText = 'divq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IMULB) {
		item.detail = 'imulb Arthmetic Operation';
		item.insertText = 'imulb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IMULW) {
		item.detail = 'imulw Arthmetic Operation';
		item.insertText = 'imulw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IMULL) {
		item.detail = 'imull Arthmetic Operation';
		item.insertText = 'imull\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IMULQ) {
		item.detail = 'imulq Arthmetic Operation';
		item.insertText = 'imulq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IDIVB) {
		item.detail = 'idivb Arthmetic Operation';
		item.insertText = 'idivb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IDIVW) {
		item.detail = 'idivw Arthmetic Operation';
		item.insertText = 'idivw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IDIVL) {
		item.detail = 'idivl Arthmetic Operation';
		item.insertText = 'idivl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.IDIVQ) {
		item.detail = 'idivq Arthmetic Operation';
		item.insertText = 'idivq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CMPB) {
		item.detail = 'cmpb Logical Operation';
		item.insertText = 'cmpb\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CMPW) {
		item.detail = 'cmpw Logical Operation';
		item.insertText = 'cmpw\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CMPL) {
		item.detail = 'cmpl Logical Operation';
		item.insertText = 'cmpl\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CMPQ) {
		item.detail = 'cmpq Logical Operation';
		item.insertText = 'cmpq\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.TESTB) {
		item.detail = 'testb Logical Operation';
		item.insertText = 'testb\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.TESTW) {
		item.detail = 'testw Logical Operation';
		item.insertText = 'testw\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.TESTL) {
		item.detail = 'testl Logical Operation';
		item.insertText = 'testl\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.TESTQ) {
		item.detail = 'testq Logical Operation';
		item.insertText = 'testq\t${2:op2}, ${1:op1}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SALB) {
		item.detail = 'salb Arthmetic Shift Operation';
		item.insertText = 'salb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SALW) {
		item.detail = 'salw Arthmetic Shift Operation';
		item.insertText = 'salw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SALL) {
		item.detail = 'sall Arthmetic Shift Operation';
		item.insertText = 'sall\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SALQ) {
		item.detail = 'salq Arthmetic Shift Operation';
		item.insertText = 'salq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHLB) {
		item.detail = 'shlb Arthmetic Shift Operation';
		item.insertText = 'shlb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHLW) {
		item.detail = 'shlw Arthmetic Shift Operation';
		item.insertText = 'shlw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHLL) {
		item.detail = 'shll Arthmetic Shift Operation';
		item.insertText = 'shll\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHLQ) {
		item.detail = 'shlq Arthmetic Shift Operation';
		item.insertText = 'shlq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SARB) {
		item.detail = 'sarb Arthmetic Shift Operation';
		item.insertText = 'sarb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SARW) {
		item.detail = 'sarw Arthmetic Shift Operation';
		item.insertText = 'sarw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SARL) {
		item.detail = 'sarl Arthmetic Shift Operation';
		item.insertText = 'sarl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SARQ) {
		item.detail = 'sarq Arthmetic Shift Operation';
		item.insertText = 'sarq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHRB) {
		item.detail = 'shrb Arthmetic Shift Operation';
		item.insertText = 'shrb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHRW) {
		item.detail = 'shrw Arthmetic Shift Operation';
		item.insertText = 'shrw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHRL) {
		item.detail = 'shrl Arthmetic Shift Operation';
		item.insertText = 'shrl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SHRQ) {
		item.detail = 'shrq Arthmetic Shift Operation';
		item.insertText = 'shrq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ROLB) {
		item.detail = 'rolb Arthmetic Shift Operation';
		item.insertText = 'rolb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ROLW) {
		item.detail = 'rolw Arthmetic Shift Operation';
		item.insertText = 'rolw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ROLL) {
		item.detail = 'roll Arthmetic Shift Operation';
		item.insertText = 'roll\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ROLQ) {
		item.detail = 'rolq Arthmetic Shift Operation';
		item.insertText = 'rolq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RORB) {
		item.detail = 'rorb Arthmetic Shift Operation';
		item.insertText = 'rorb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RORW) {
		item.detail = 'rorw Arthmetic Shift Operation';
		item.insertText = 'rorw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RORL) {
		item.detail = 'rorl Arthmetic Shift Operation';
		item.insertText = 'rorl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RORQ) {
		item.detail = 'rorq Arthmetic Shift Operation';
		item.insertText = 'rorq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCLB) {
		item.detail = 'rclb Arthmetic Shift Operation';
		item.insertText = 'rclb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCLW) {
		item.detail = 'rclw Arthmetic Shift Operation';
		item.insertText = 'rclw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCLL) {
		item.detail = 'rcll Arthmetic Shift Operation';
		item.insertText = 'rcll\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCLQ) {
		item.detail = 'rclq Arthmetic Shift Operation';
		item.insertText = 'rclq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCRB) {
		item.detail = 'rcrb Arthmetic Shift Operation';
		item.insertText = 'rcrb\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCRW) {
		item.detail = 'rcrw Arthmetic Shift Operation';
		item.insertText = 'rcrw\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCRL) {
		item.detail = 'rcrl Arthmetic Shift Operation';
		item.insertText = 'rcrl\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RCRQ) {
		item.detail = 'rcrq Arthmetic Shift Operation';
		item.insertText = 'rcrq\t${1:src/imm}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NOTB) {
		item.detail = 'notb Arthmetic Operation';
		item.insertText = 'notb\t${1:reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NOTW) {
		item.detail = 'notw Arthmetic Operation';
		item.insertText = 'notw\t${1:reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NOTL) {
		item.detail = 'notl Arthmetic Operation';
		item.insertText = 'notl\t${1:reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NOTQ) {
		item.detail = 'notq Arthmetic Operation';
		item.insertText = 'notq\t${1:reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ANDB) {
		item.detail = 'andb Arthmetic Operation';
		item.insertText = 'andb\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ANDW) {
		item.detail = 'andw Arthmetic Operation';
		item.insertText = 'andw\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ANDL) {
		item.detail = 'andl Arthmetic Operation';
		item.insertText = 'andl\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ANDQ) {
		item.detail = 'andq Arthmetic Operation';
		item.insertText = 'andq\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ORB) {
		item.detail = 'orb Arthmetic Operation';
		item.insertText = 'orb\t\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ORW) {
		item.detail = 'orw Arthmetic Operation';
		item.insertText = 'orw\t\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ORL) {
		item.detail = 'orl Arthmetic Operation';
		item.insertText = 'orl\t\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ORQ) {
		item.detail = 'orq Arthmetic Operation';
		item.insertText = 'orq\t\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.XORB) {
		item.detail = 'xorb Arthmetic Operation';
		item.insertText = 'xorb\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.XORW) {
		item.detail = 'xorw Arthmetic Operation';
		item.insertText = 'xorw\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.XORL) {
		item.detail = 'xorl Arthmetic Operation';
		item.insertText = 'xorl\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.XORQ) {
		item.detail = 'xorq Arthmetic Operation';
		item.insertText = 'xorq\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MOVB) {
		item.detail = 'movb Arthmetic Operation';
		item.insertText = 'movb\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MOVW) {
		item.detail = 'movw Arthmetic Operation';
		item.insertText = 'movw\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MOVL) {
		item.detail = 'movl Arthmetic Operation';
		item.insertText = 'movl\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.MOVQ) {
		item.detail = 'movq Arthmetic Operation';
		item.insertText = 'movq\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LEAB) {
		item.detail = 'leab Arthmetic Operation';
		item.insertText = 'leab\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LEAW) {
		item.detail = 'leaw Arthmetic Operation';
		item.insertText = 'leaw\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LEAL) {
		item.detail = 'leal Arthmetic Operation';
		item.insertText = 'leal\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LEAQ) {
		item.detail = 'leaq Arthmetic Operation';
		item.insertText = 'leaq\t${1:src}, ${2:dest}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.PUSHB) {
		item.detail = 'pushb Stack Operation';
		item.insertText = 'pushb\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.PUSHW) {
		item.detail = 'pushw Stack Operation';
		item.insertText = 'pushw\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.PUSHL) {
		item.detail = 'pushl Stack Operation';
		item.insertText = 'pushl\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.PUSHQ) {
		item.detail = 'pushq Stack Operation';
		item.insertText = 'pushq\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.POPB) {
		item.detail = 'popb Stack Operation';
		item.insertText = 'popb\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.POPW) {
		item.detail = 'popw Stack Operation';
		item.insertText = 'popw\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.POPL) {
		item.detail = 'popl Stack Operation';
		item.insertText = 'popl\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.POPQ) {
		item.detail = 'popq Stack Operation';
		item.insertText = 'popq\t${1:val/reg}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ENTER) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LEAVE) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.RET) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.LOOP) {
		item.detail = 'loop Flow Operation';
		item.insertText = 'loop\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	} 
	else if (item.data === OPNUM.J) {
		item.detail = 'j Flow Operation';
		item.insertText = 'j\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JMP) {
		item.detail = 'jmp Flow Operation';
		item.insertText = 'jmp\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Used to jump unconditionally to a place.';
	}
	else if (item.data === OPNUM.JA) {
		item.detail = 'ja Flow Operation';
		item.insertText = 'ja\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JAE) {
		item.detail = 'jae Flow Operation';
		item.insertText = 'jae\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JB) {
		item.detail = 'jb Flow Operation';
		item.insertText = 'jb\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JBE) {
		item.detail = 'jbe Flow Operation';
		item.insertText = 'jbe\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JE) {
		item.detail = 'je Flow Operation';
		item.insertText = 'je\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JG) {
		item.detail = 'jg Flow Operation';
		item.insertText = 'jg\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JGE) {
		item.detail = 'jge Flow Operation';
		item.insertText = 'jge\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JL) {
		item.detail = 'jl Flow Operation';
		item.insertText = 'jl\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JLE) {
		item.detail = 'jle Flow Operation';
		item.insertText = 'jle\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNA) {
		item.detail = 'jna Flow Operation';
		item.insertText = 'jna\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNAE) {
		item.detail = 'jnae Flow Operation';
		item.insertText = 'jnae\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNB) {
		item.detail = 'jnb Flow Operation';
		item.insertText = 'jnb\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNBE) {
		item.detail = 'jnbe Flow Operation';
		item.insertText = 'jnbe\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNE) {
		item.detail = 'jne Flow Operation';
		item.insertText = 'jne\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNG) {
		item.detail = 'jng Flow Operation';
		item.insertText = 'jng\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNGE) {
		item.detail = 'jnge Flow Operation';
		item.insertText = 'jnge\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNL) {
		item.detail = 'jnl Flow Operation';
		item.insertText = 'jnl\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNLE) {
		item.detail = 'jnle Flow Operation';
		item.insertText = 'jnle\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JC) {
		item.detail = 'jc Flow Operation';
		item.insertText = 'jc\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JO) {
		item.detail = 'jo Flow Operation';
		item.insertText = 'jo\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JP) {
		item.detail = 'jp Flow Operation';
		item.insertText = 'jp\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JPE) {
		item.detail = 'jpe Flow Operation';
		item.insertText = 'jpe\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JPO) {
		item.detail = 'jpo Flow Operation';
		item.insertText = 'jpo\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JS) {
		item.detail = 'js Flow Operation';
		item.insertText = 'js\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JZ) {
		item.detail = 'jz Flow Operation';
		item.insertText = 'jz\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNC) {
		item.detail = 'jnc Flow Operation';
		item.insertText = 'jnc\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNO) {
		item.detail = 'jno Flow Operation';
		item.insertText = 'jno\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNP) {
		item.detail = 'jnp Flow Operation';
		item.insertText = 'jnp\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNS) {
		item.detail = 'jns Flow Operation';
		item.insertText = 'jns\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JNZ) {
		item.detail = 'jnz Flow Operation';
		item.insertText = 'jnz\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JCXZ) {
		item.detail = 'jcxz Flow Operation';
		item.insertText = 'jcxz\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.JECXZ) {
		item.detail = 'jecxz Flow Operation';
		item.insertText = 'jecxz\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.NOP) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.XCHG) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CALL) {
		item.detail = 'call Flow Operation';
		item.insertText = 'call\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.INT) {
		item.detail = 'int Flow Operation';
		item.insertText = 'int\t\t${1:label/imm}\n';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EAX) {
		item.detail = 'Extended accumulate register.';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.AX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.AL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.AR) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EBX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.BX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.BL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.BR) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ECX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.CR) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EDX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DX) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DL) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DR) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EDI) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.DI) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ESI) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.SI) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EIP) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.ESP) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
	else if (item.data === OPNUM.EBP) {
		item.detail = '';
		item.insertText = '';
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.documentation = 'Usage:\n\n';
	}
  return item;
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
