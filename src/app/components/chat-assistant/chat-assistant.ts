import { Component } from '@angular/core';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chat-assistant',
  standalone: false,
  templateUrl: './chat-assistant.html',
  styleUrl: './chat-assistant.css'
})
export class ChatAssistant {
  isOpen = false;
  messages: Message[] = [];
  userInput = '';
  isTyping = false;

  constructor() {
    // Message de bienvenue
    this.messages.push({
      text: "Bonjour! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui? 😊",
      sender: 'bot',
      timestamp: new Date()
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      text: this.userInput,
      sender: 'user',
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    // Copier le message pour le traitement
    const messageText = this.userInput.toLowerCase();
    this.userInput = '';

    // Simuler le délai de réponse du bot
    this.isTyping = true;
    setTimeout(() => {
      const botResponse = this.getBotResponse(messageText);
      this.messages.push({
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      });
      this.isTyping = false;

      // Scroll vers le bas
      setTimeout(() => this.scrollToBottom(), 100);
    }, 1000 + Math.random() * 1000); // Délai aléatoire entre 1-2 secondes
  }

  private getBotResponse(message: string): string {
    // Réponses basées sur des mots-clés
    if (message.includes('bonjour') || message.includes('salut') || message.includes('hello')) {
      return "Bonjour! Comment puis-je vous assister aujourd'hui? 👋";
    }
    
    if (message.includes('produit') || message.includes('article')) {
      return "Nous avons une large gamme de produits! Vous pouvez parcourir notre catalogue sur la page d'accueil. Cherchez-vous quelque chose en particulier? 🛍️";
    }
    
    if (message.includes('commande') || message.includes('commander')) {
      return "Pour passer une commande, ajoutez simplement les produits à votre panier et cliquez sur 'Passer la commande'. Besoin d'aide avec une commande existante? 📦";
    }
    
    if (message.includes('panier') || message.includes('cart')) {
      return "Votre panier est accessible via l'icône 🛒 en haut à droite. Vous pouvez y voir tous vos articles et modifier les quantités. 🛒";
    }
    
    if (message.includes('prix') || message.includes('coût') || message.includes('tarif')) {
      return "Les prix de tous nos produits sont affichés en dirhams (DH). Pour connaître le prix d'un produit spécifique, consultez sa fiche détaillée. 💰";
    }
    
    if (message.includes('livraison') || message.includes('expédition')) {
      return "Nous offrons la livraison dans tout le Maroc. Les délais varient selon votre localisation. Pour plus d'informations, contactez notre service client. 🚚";
    }
    
    if (message.includes('aide') || message.includes('help') || message.includes('support')) {
      return "Je suis là pour vous aider! Vous pouvez me poser des questions sur nos produits, commandes, livraison, ou tout autre sujet. N'hésitez pas! 💬";
    }
    
    if (message.includes('merci') || message.includes('thank')) {
      return "De rien! Je suis toujours là si vous avez d'autres questions. Bon shopping! 😊";
    }
    
    if (message.includes('recommandation') || message.includes('recommande') || message.includes('conseil')) {
      return "Sur chaque page produit, vous trouverez une section 'Produits Recommandés' avec des articles similaires qui pourraient vous intéresser! ✨";
    }
    
    if (message.includes('catégorie') || message.includes('category')) {
      return "Nos produits sont organisés par catégories pour faciliter votre recherche. Utilisez les filtres disponibles sur la page d'accueil! 📁";
    }
    
    if (message.includes('stock') || message.includes('disponible')) {
      return "La disponibilité de chaque produit est indiquée sur sa fiche. Si un produit est en rupture de stock, nous vous le signalerons clairement. 📊";
    }
    
    // Réponse par défaut
    const defaultResponses = [
      "Intéressant! Pouvez-vous m'en dire plus? 🤔",
      "Je comprends. Comment puis-je vous aider davantage? 💡",
      "Merci pour votre message! Pour une assistance plus spécifique, n'hésitez pas à détailler votre question. 📝",
      "Je suis là pour vous aider avec vos achats et répondre à vos questions sur notre boutique! 🏪"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private scrollToBottom() {
    const chatBody = document.querySelector('.chat-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
