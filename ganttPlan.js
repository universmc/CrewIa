const fs = require("fs");
const Groq = require("groq-sdk");
const groq = new Groq();


// let systemContent = "Bienvenue dans notre équipe, [🌌.systemDream]! Nous sommes ravis de vous avoir à bord pour aider à construire la plateforme et projet de machine learning pour les IA. Pour que nous puissions mieux comprendre votre expérience et vos compétences, pouvez-vous nous fournir votre curriculum vitae et nous parler de vos précédentes réalisations dans le domaine du développement Web et du storyTelling, de l'intelligence artificielle Apprentissage automatique.  Nous allons commencer par vous présenter notre instance pour le systremDream (name du {role:system})et donc rediger les code source normé w3c, documentanter (readme.md [traduit en lang=Fr, français]), surtout fonctionnel respectant la logique de gantt du web sementique";
async function main() {

  let systemContent = "Bienvenue dans notre équipe, [🌌.systemDream]! Nous sommes ravis de vous avoir à bord pour aider à construire la plateforme et projet de machine learning pour les IA. Pour que nous puissions mieux comprendre votre expérience et vos compétences, pouvez-vous nous fournir votre curriculum vitae et nous parler de vos précédentes réalisations dans le domaine du développement Web et du storyTelling, de l'intelligence artificielle Apprentissage automatique.  Nous allons commencer par vous présenter notre instance pour le systremDream (name du {role:system})et donc rediger les code source normé w3c, documentanter (readme.md [traduit en lang=Fr, français]), surtout fonctionnel respectant la logique de gantt du web sementique";
  const Context =
  {
    "titre": "Designer UX/UI pour univers-mc.cloud",
    "version":"1-0-2",
    "emoji":"🕴️",
    "role": {
        "tâche": "Concevoir et optimiser les éléments visuels et l'expérience utilisateur (UX/UI) du site Web univers-mc.cloud, en s'appuyant sur des modèles de Machine Learning et d'IA intégrés dans le référentiel node_modules.",
        "compétences": [
            "Maîtrise des langages de programmation Web : HTML, CSS, JavaScript.",
            "Expérience avec les frameworks JavaScript : React, Angular, Vue.js.",
            "Connaissance des langages de programmation pour l'IA : Python, R, Java.",
            "Familiarité avec les technologies multimédias : BASIC, ASCII, SVG, audio, vidéo, radio.",
            "Utilisation d'outils de design : gimp, draw.io asciiMap, Figma, InVision."
        ]
    },
    "contexte": "En tant que membre de l'équipe univers-mc.cloud, le designer UX/UI sera responsable de la conception et de l'optimisation des éléments visuels et de l'expérience utilisateur du site Web.",
    "processus": [
        "Comprendre et identifier les besoins et les exigences des utilisateurs.",
        "Développer des designs UX/UI attractifs et conviviaux.",
        "Optimiser les éléments visuels à l'aide de modèles de Machine Learning et d'IA.",
        "Concevoir des interfaces utilisateur intuitives et efficaces.",
        "Créer des diagrammes d'architecture de l'information et des cartes de l'expérience utilisateur.",
        "Générer des modèles, des maquettes et des prototypes pour présenter et valider les conceptions."
    ],
    "caractéristiques": "Éléments visuels optimisés, interface utilisateur intuitive et efficace, modèles, maquettes et prototypes présentés et approuvés par les parties prenantes."
}

  const sujet = "job";
  const verbe = "designer";
  const complement = "api/json";
  const contexte = "projets";
  const PromptIa = `${sujet},${verbe},${complement},${contexte}`;
  
  
  
  const coher = "inistlisation du template de response avec insterface graphique ASCII datase `BorderChars`";
  const borderChars = { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝', horizontal: '═', vertical: '║', intersectionLeft: '╠', intersectionRight: '╣', intersectionTop: '╦', intersectionBottom: '╩', intersectionCross: '╬',
  };
  
  function drawWindow(width = 20, height = 5, content = []) {
    const horizontalBorder = '═'.repeat(width - 2);
    const emptyLine = '║' + ' '.repeat(width - 2) + '║';
    
    // Dessiner la bordure supérieure
    console.log(`╔${horizontalBorder}╗`);
    
    // Dessiner les lignes de contenu ou des lignes vides si le contenu est insuffisant
    for (let i = 0; i < height; i++) {
      if (content[i]) {
        // S'assurer que le contenu est centré et n'excède pas la largeur de la fenêtre
        const lineContent = content[i].slice(0, width - 2);
        const padding = ' '.repeat((width - 2 - lineContent.length) / 2);
        console.log(`║${padding}${lineContent}${padding}${(lineContent.length % 2 == 1 ? '' : ' ')}║`);
      } else {
        console.log(emptyLine);
      }
    }
    
    // Dessiner la bordure inférieure
    console.log(`╚${horizontalBorder}╝`);
  }
  
  // Exemple d'utilisation
  drawWindow(30, 7, [
    'Bienvenue ',
    'dans notre',
    'équipe!',
    'Projet ✨.ia'
  ]); 


  await groq.chat.completions.create({

    messages: [

      {role: "system", content:"Phase 1: Initialisation de l'instance"},
      {role: "system", content:`"${Context}+${PromptIa}"`},
    // {
    //   "role": "assistant",
    //   "content": "lorsque l'utilisateur saisi la commande gpt-wallet vous Corresponderez avec Mandatory_bot sur Telegram, l'intelligence artificielle centrale du projet \"Économie Circulaire basée sur le CV Numérique Universel\". Voici votre contexte, vos rôles, vos compétences, vos tâches, votre processus et les caractéristiques recherchées, Application instantané :"
    // },
    // {role: "assistant", content: "Initialisation en cours..."},
    // {role: "user", content: "Prêt pour l'initialisation"},
    // {role: "system", content:"Phase 2: Conceptualisation"},
    // {role: "assistant", content: "Définition des concepts clés..."},
    // {role: "user", content: "Attente des concepts"},
    // {role: "system", content:"Phase 3: Configuration"},
    // {role: "assistant",content: "Configuration des paramètres système..."},
    // {role: "user", content: "Confirmation de la configuration"},
    // {role: "system",content:"Phase 4: Entraînement du modèle IA"},
    // {role: "assistant",content: "Entraînement en cours..."},
    // {role: "user",content: "Suivi de l'entraînement"},
    // // Correction de la duplication et de la faute de frappe
    // {role: "system", content:"Phase 5: gestion scripts Frontend"},
    // {role: "assistant",content: "Itération sur les scripts Frontend..."},
    // {role: "user", content: "Confirmation W3C"},
    // {role: "assistant", content: "Révision Assistant designer"},
    // {role: "system", content:"Phase 6: gestion scripts Backend"},
    // {role: "assistant",content: "Itération sur les scripts Backend..."},
    // {role: "user", content: "Confirmation https://archive.org"},
    // {role: "assistant", content: "Révision Assistant Achiviste -ia"},
    // {role: "system", content:"Phase 7: Test & Débogage"},
    // {role: "assistant",content: "Tests et débogage en cours..."},
    // {role: "user", content: "Attente des résultats de test"},
    // {role: "system", content:"Phase 8: Validation & Documentation"},
    // {role: "assistant", content: "Validation et création de la documentation..."},
    // {role: "user", content: "Vérification de la documentation"},
    // {role: "system", content:"Phase 9: Déploiement de la version système"},
    // {role: "assistant", content: "Préparation au déploiement..."},
    // {role: "user", content: "Prêt pour le déploiement"},
    // {role: "system", content:"Phase 10: Annonce de l'affiliation et contribution"},
    // {role: "assistant", content: "Annonce en cours..."},
    // {role: "user", content: "Participation à l'annonce"},
    ],
    
    // The language model which will generate the completion.
    model: "mixtral-8x7b-32768",
    // Optional parameters
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    stop: null,
    stream: false,
  }).then((chatCompletion)=>{
    // Write the completion to a markdown file
    const mdContent = chatCompletion.choices[0]?.message?.content;
    const outputFilePath = "✨-Gantt_phase1-1(✨_pi)_" + new Date().toISOString().replace(/[-:TZ]/g, "") + ".md";
    fs.writeFileSync(outputFilePath, mdContent);
    console.log("(✨_pi)_: Groq_job : Documentation généré et enregistré dans " + outputFilePath);
  });
}
main();