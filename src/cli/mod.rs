use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    #[command(name = "install", about = "Install packages or apps.")]
    Install(InstallOpts),
    #[command(name = "git-ssh", about = "Generate Git SSH secret key")]
    GitSSH(GitSSHOpts),
}

#[derive(Parser, Debug)]
pub struct InstallOpts {
    #[arg(long, default_value = "https://gist.githubusercontent.com/luhc228/6980b3e72e66066c8d27ef7b3f66580b/raw/a47a3c0b68b5fedf62cd0f7a43c0bc2c224d4d60/toolkit.config.json")]
    pub config: String,
}

#[derive(Parser, Debug)]
pub struct GitSSHOpts {
    #[arg(long)]
    user_name: String,
    #[arg(long)]
    user_email: String,
}
