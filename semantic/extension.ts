// We want to make jmp LABEL semantic with "LABEL" colored!

const tokenTypes = ['class', 'interface', 'enum', 'function', 'variable'];
const tokenModifiers = ['declaration', 'documentation'];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    // analyze the document and return semantic tokens

    const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
    // on line 1, characters 1-5 are a class declaration
    tokensBuilder.push(
      new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 5)),
      'class',
      ['declaration']
    );
    return tokensBuilder.build();
  }
};

const selector = { language: 'java', scheme: 'file' }; // register for all Java documents from the local file system

vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);

// const tokenTypes = new Map();
// const tokenModifiers = new Map();
// const legend = (function () {
//     const tokenTypesLegend = [
//         'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
//         'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
//         'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
//     ];
//     tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));
//     const tokenModifiersLegend = [
//         'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
//         'modification', 'async'
//     ];
//     tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));
//     return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
// })();
// function activate(context) {
//     context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'semanticLanguage' }, new DocumentSemanticTokensProvider(), legend));
// }
// exports.activate = activate;
// class DocumentSemanticTokensProvider {
//     async provideDocumentSemanticTokens(document, token) {
//         const allTokens = this._parseText(document.getText());
//         const builder = new vscode.SemanticTokensBuilder();
//         allTokens.forEach((token) => {
//             builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
//         });
//         return builder.build();
//     }
//     _encodeTokenType(tokenType) {
//         if (tokenTypes.has(tokenType)) {
//             return tokenTypes.get(tokenType);
//         }
//         else if (tokenType === 'notInLegend') {
//             return tokenTypes.size + 2;
//         }
//         return 0;
//     }
//     _encodeTokenModifiers(strTokenModifiers) {
//         let result = 0;
//         for (let i = 0; i < strTokenModifiers.length; i++) {
//             const tokenModifier = strTokenModifiers[i];
//             if (tokenModifiers.has(tokenModifier)) {
//                 result = result | (1 << tokenModifiers.get(tokenModifier));
//             }
//             else if (tokenModifier === 'notInLegend') {
//                 result = result | (1 << tokenModifiers.size + 2);
//             }
//         }
//         return result;
//     }
//     _parseText(text) {
//         const r = [];
//         const lines = text.split(/\r\n|\r|\n/);
//         for (let i = 0; i < lines.length; i++) {
//             const line = lines[i];
//             let currentOffset = 0;
//             do {
//                 const openOffset = line.indexOf('[', currentOffset);
//                 if (openOffset === -1) {
//                     break;
//                 }
//                 const closeOffset = line.indexOf(']', openOffset);
//                 if (closeOffset === -1) {
//                     break;
//                 }
//                 const tokenData = this._parseTextToken(line.substring(openOffset + 1, closeOffset));
//                 r.push({
//                     line: i,
//                     startCharacter: openOffset + 1,
//                     length: closeOffset - openOffset - 1,
//                     tokenType: tokenData.tokenType,
//                     tokenModifiers: tokenData.tokenModifiers
//                 });
//                 currentOffset = closeOffset;
//             } while (true);
//         }
//         return r;
//     }
//     _parseTextToken(text) {
//         const parts = text.split('.');
//         return {
//             tokenType: parts[0],
//             tokenModifiers: parts.slice(1)
//         };
//     }
// }
// //# sourceMappingURL=extension.js.map