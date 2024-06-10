const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq();

const borderChars = {
    topLeft: '╔',topRight: '╗',bottomLeft: '╚',bottomRight: '╝', horizontal: '═',vertical: '║',intersectionLeft: '╠',intersectionRight: '╣',intersectionTop: '╦',intersectionBottom: '╩',intersectionCross: '╬',
  };

const howtoGroq = {
    "Chapiter": [
    {
    "description": "Apprendre les concepts de base",
    "details": [
    "Démarrer avec la compréhension des principes de base du langage",
    "Étudier la syntaxe, les types de données et les structures de contrôle"
    ]
    },
    {
    "description": "Étudier les exemples",
    "details": [
    "Examiner des exemples existants",
    "Comprendre les fonctionnalités et la syntaxe de Grog"
    ]
    },
    {
    "description": "Pratiquer la programmation",
    "details": [
    "Mettre en pratique les connaissances acquises",
    "Écrire du code Grog pour résoudre des problèmes ou réaliser des tâches spécifiques"
    ]
    },
    {
    "description": "Maîtriser les fonctionnalités avancées",
    "details": [
    "Explorer les fonctionnalités avancées de Grog",
    "Étudier les fonctions, les classes et les modules",
    "Créer des programmes plus complexes"
    ]
    },
    {
    "description": "Partager et recevoir des commentaires",
    "details": [
    "Partager votre code avec la communauté Grog",
    "Demander des commentaires et des conseils pour améliorer vos compétences et votre code"
    ]
    }
    ]
    }
    

async function main() {

  let systemContent = "Bienvenue dans notre équipe, [🌌.systemDream]! Nous sommes ravis de vous avoir à bord pour aider à construire la plateforme et projet de machine learning pour les IA. Pour que nous puissions mieux comprendre votre expérience et vos compétences,pouvez-vous nous fournir votre curriculum vitae et nous parler de vos précédentes réalisations dans le domaine du développement Web et du storyTelling, de l'intelligence artificielle Apprentissage automatique.  Nous allons commencer par vous présenter notre instance pour le systremDream (name du {role:system})et donc rediger les code source normé w3c, documentanter (readme.md [traduit en lang=Fr, français]), surtout fonctionnel respectant la logique de gantt du web sementique";
  const BorderChars = "inistlisation du template de response avec insterface graphique ASCII datase `BorderChars`";
  const HowToqgroq = howtoGroq;
  const chatCompletion = await groq.chat.completions.create({
    "messages": [

        {role: "system", content:"Phase 1: Initialisation de l'instance"},
        {
          "role": "assistant",
          "content": "lorsque l'utilisateur saisi la commande gpt-wallet vous Corresponderez avec Mandatory_bot sur Telegram, l'intelligence artificielle centrale du projet \"Économie Circulaire basée sur le CV Numérique Universel\". Voici votre contexte, vos rôles, vos compétences, vos tâches, votre processus et les caractéristiques recherchées, Application instantané :"
        },
        {role: "assistant", content: "Initialisation en cours..."},
        {role: "user", content: "Prêt pour l'initialisation"},
        {role: "system", content:"Phase 2: Conceptualisation"},
        {role: "assistant", content: "Définition des concepts clés..."},
        {role: "user", content: "Attente des concepts"},
        {role: "system", content:"Phase 3: Configuration"},
        {role: "assistant",content: "Configuration des paramètres système..."},
        {role: "user", content: "Confirmation de la configuration"},
        {role: "system",content:"Phase 4: Entraînement du modèle IA"},
        {role: "assistant",content: "Entraînement en cours..."},
        {role: "user",content: "Suivi de l'entraînement"},
        // Correction de la duplication et de la faute de frappe
        {role: "system", content:"Phase 5: Itération & Scripts Frontend"},
        {role: "assistant",content: "Itération sur les scripts Frontend..."},
        {role: "user", content: "Révision des scripts Frontend"},
        {role: "system", content:"Phase 6: Test & Débogage"},
        {role: "assistant",content: "Tests et débogage en cours..."},
        {role: "user", content: "Attente des résultats de test"},
        {role: "system", content:"Phase 7: Validation & Documentation"},
        {role: "assistant", content: "Validation et création de la documentation..."},
        {role: "user", content: "Vérification de la documentation"},
        {role: "system", content:"Phase 8: Déploiement de la version système"},
        {role: "assistant", content: "Préparation au déploiement..."},
        {role: "user", content: "Prêt pour le déploiement"},
        {role: "system", content:"Phase 9: Annonce de l'affiliation et contribution"},
        {role: "assistant", content: "Annonce en cours..."},
        {role: "user", content: "Participation à l'annonce"}, 
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.6,
    max_tokens: 2048,
    top_p: 1,
    stop: null,
    stream: false
}).then((chatCompletion)=>{
    const gqlContent = chatCompletion.choices[0]?.message?.content;
    const outputFilePath = "build/mdMessages_" + new Date().toISOString().replace(/[-:TZ]/g, "") + ".gql";
    fs.writeFileSync(outputFilePath, gqlContent);
    console.log("Documentation du contructor généré et enregistré dans " + outputFilePath);
});
}

main();