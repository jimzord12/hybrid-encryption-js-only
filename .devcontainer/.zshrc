export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="agnoster"
# or ZSH_THEME="powerlevel10k/powerlevel10k"

plugins=(
  git
  node
  npm
  docker
  kubectl
  zsh-autosuggestions
  zsh-syntax-highlighting
  colored-man-pages
  extract
  z
)

source $ZSH/oh-my-zsh.sh

# Custom aliases
alias ll="ls -la"
alias la="ls -la"
alias ..="cd .."
alias ...="cd ../.."
alias gs="git status"
alias ga="git add"
alias gc="git commit"
alias gp="git push"

# Node.js aliases
alias ni="npm install"
alias ns="npm start"
alias nt="npm test"
alias nr="npm run"
