import * as vscode from 'vscode';
import axios from 'axios';  // Use axios to make HTTP requests

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('autodoc.generateDoc', async () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const selectedFunction = document.getText(selection);

      if (selectedFunction) {
        try {
          const docString = await callGptApi(selectedFunction);
          editor.edit(editBuilder => {
            editBuilder.insert(selection.start, `/**\n * ${docString.trim()}\n */\n`);
          });
          vscode.window.showInformationMessage('Documentation added!');
        } catch (error) {
          console.error(error);
          vscode.window.showErrorMessage('Failed to generate documentation.');
        }
      } else {
        vscode.window.showErrorMessage('Please select a function to document.');
      }
    }
  });

  context.subscriptions.push(disposable);
}

async function callGptApi(functionCode: string): Promise<string> {
  const response = await axios.post('https://api.openai.com/v1/completions', {
    model: 'text-davinci-003',
    prompt: `Generate JSDoc for the following function:\n\n${functionCode}`,
    max_tokens: 100,
    temperature: 0
  }, {
    headers: {
      'Authorization': `Bearer key`
    }
  });

  return response.data.choices[0].text;
}

export function deactivate() {}
