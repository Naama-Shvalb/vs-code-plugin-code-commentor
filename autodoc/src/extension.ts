import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('autodoc.generateDoc', async () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const selectedFunction = document.getText(selection);

      if (selectedFunction) {
        try {
          const apiKey = await getApiKey();
          if (!apiKey) return;

          const docString = await callGptApi(selectedFunction, apiKey);
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

async function getApiKey(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('autodoc');
  let apiKey = config.get<string>('apiKey');

  if (!apiKey) {
    apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your OpenAI API key',
      ignoreFocusOut: true,
      password: true
    });

    if (apiKey) {
      await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('API key saved successfully!');
    } else {
      vscode.window.showErrorMessage('API key is required to generate documentation.');
    }
  }

  return apiKey;
}

async function callGptApi(functionCode: string, apiKey: string): Promise<string> {
  const response = await axios.post('https://api.openai.com/v1/completions', {
    model: 'text-davinci-003',
    prompt: `Generate JSDoc for the following function:\n\n${functionCode}`,
    max_tokens: 100,
    temperature: 0
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return response.data.choices[0].text;
}

export function deactivate() {}
