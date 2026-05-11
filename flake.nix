{
  description = "Enterprise Platform DevShell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            git curl wget jq yq-go openssl gnused gnumake
            nodejs_24 pnpm bun
            go gopls golangci-lint
            python3 python3Packages.pip python3Packages.virtualenv
            jdk21 maven gradle
            rustc cargo clippy rustfmt
            dotnet-sdk_9
            terraform kubectl kubernetes-helm k9s kustomize
            docker docker-compose gh trivy sops age
          ];

          shellHook = ''
            if [ -n "$ZSH_VERSION" ]; then
              autoload -Uz colors && colors
              export PROMPT="%F{cyan}(platform-dev)%f $PROMPT"
            else
              export PS1="(platform-dev) $PS1"
            fi

            alias k="kubectl"
            alias kgp="kubectl get pods"
            alias kctx="kubectl config current-context"
            alias helmup="helm dependency update infrastructure/helm/platform"
            alias deploy="gh workflow run main.yml --ref main"
            alias logs="docker compose logs -f --tail=200"
            alias dcu="docker compose up --build"
            alias dcd="docker compose down --remove-orphans"
            alias scanfs="trivy fs --security-checks vuln,config,secret ."
            alias scanimg="trivy image"
            alias tf="terraform -chdir=infrastructure/terraform"
            alias nix-develop="nix develop"
            alias devshell="nix develop"

            echo ""
            echo "Enterprise Platform Environment Loaded"
            echo "Useful commands: dcu, logs, scanfs, deploy, tf"
            echo "Nix command: nix develop (space). Compatibility alias: nix-develop"
            echo ""
          '';
        };
      });
}
