#!/bin/bash
set -e

echo "Installing npm dependencies..."
npm install -g npm@11.5.2 && npm install

echo "Installing oh-my-zsh plugins..."
# Install zsh-autosuggestions
if [ ! -d "${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions" ]; then
    git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
fi

# Install zsh-syntax-highlighting
if [ ! -d "${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting" ]; then
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
fi

echo "Copying custom .zshrc..."
# Copy your custom .zshrc file
cp .devcontainer/.zshrc ~/.zshrc

source ~/.zshrc

echo "Setup complete!"
