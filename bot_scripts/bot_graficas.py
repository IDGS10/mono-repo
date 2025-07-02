import os
import matplotlib.pyplot as plt
from github import Github
from telegram import Bot, Update
from telegram.ext import CommandHandler, Updater, MessageHandler, Filters

# Configuración
TOKEN = os.getenv('TELEGRAM_TOKEN')
TOKEN_G = os.getenv('TOKEN_G')
REPO_NAME = os.getenv('REPO_NAME')

def start(update: Update, context):
    help_text = """
🤖 *Bot de GitHub Notifications*
    
Comandos disponibles:
/grafica - Muestra commits por rama
/grafica [rama] - Muestra detalles de una rama
/resumen - Estadísticas del repositorio
    """
    update.message.reply_text(help_text, parse_mode='Markdown')

def grafica_commits(update: Update, context):
    try:
        g = Github(TOKEN_G)
        repo = g.get_repo(REPO_NAME)
        
        if context.args:
            return grafica_rama_especifica(update, context, repo)
            
        branches = repo.get_branches()
        data = {b.name: repo.get_commits(sha=b.name).totalCount for b in branches}
        
        plt.figure(figsize=(10, 5))
        plt.bar(data.keys(), data.values())
        plt.title('Commits por Rama')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        plt.savefig('chart.png')
        update.message.reply_photo(photo=open('chart.png', 'rb'))
        plt.close()
        
    except Exception as e:
        update.message.reply_text(f"❌ Error: {str(e)}")

def grafica_rama_especifica(update: Update, context, repo):
    branch_name = ' '.join(context.args)
    commits = repo.get_commits(sha=branch_name)
    authors = {}
    
    for commit in commits[:100]:  # Limitar a 100 commits para eficiencia
        author = commit.author.login if commit.author else "Unknown"
        authors[author] = authors.get(author, 0) + 1
    
    plt.figure(figsize=(8, 8))
    plt.pie(authors.values(), labels=authors.keys(), autopct='%1.1f%%')
    plt.title(f'Commits en {branch_name}')
    
    plt.savefig('pie.png')
    update.message.reply_photo(photo=open('pie.png', 'rb'))
    plt.close()

def setup_bot():
    updater = Updater(TOKEN)
    dp = updater.dispatcher
    
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("help", start))
    dp.add_handler(CommandHandler("grafica", grafica_commits))
    dp.add_handler(CommandHandler("resumen", resumen_repo))
    
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    setup_bot()