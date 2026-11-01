export type HelpTopic = {
  id: string;
  question: string;
  answer: string[];
};

export const HELP_GUIDE: HelpTopic[] = [
  {
    id: 'start',
    question: 'Hoe start ik met StudyFlow?',
    answer: [
      'Maak eerst je schooljaar en examenperiodes aan tijdens de start. Je kunt die later altijd aanpassen in Instellingen.',
      'Voeg daarna je vakken toe op de pagina Mijn vakken. Per vak kun je een kleur, moeilijkheid en je huidige zekerheid aangeven.',
      'Plan je examens in bij het vak. Het dashboard laat dan zien wat er het eerst aankomt.',
    ],
  },
  {
    id: 'dashboard',
    question: 'Wat staat er op het dashboard?',
    answer: [
      'Het dashboard geeft een overzicht van je vakken en examens, met snelle acties om direct een examen toe te voegen.',
      'Gebruik het zoekveld bovenaan om snel naar een vak of examen te gaan.',
    ],
  },
  {
    id: 'assistant',
    question: 'Hoe gebruik ik de AI-studieassistent?',
    answer: [
      'Stel een vraag of vraag om uitleg over de stof, bijvoorbeeld "Leg de fotosynthese uit in vijf zinnen".',
      'De assistent geeft antwoorden als hulp bij het leren. Controleer belangrijke feiten altijd in je boek of op je schoolplatform.',
    ],
  },
  {
    id: 'flashcards',
    question: 'Hoe werken flashcards?',
    answer: [
      'Maak een kaartje met een vraag voorop en het antwoord achterop, gekoppeld aan een vak.',
      'Kies Oefenen om de kaartjes te doorlopen. Markeer ze als "Gekend" of "Nog oefenen" om je voortgang te volgen.',
    ],
  },
  {
    id: 'focus',
    question: 'Hoe gebruik ik de Focus-timer?',
    answer: [
      'Kies een werkblok van 25 of 50 minuten en start de timer. Na elk werkblok volgt een korte pauze.',
      'Je kunt de timer pauzeren, overslaan of resetten. Het aantal sessies wordt bijgehouden zolang de pagina open staat.',
    ],
  },
  {
    id: 'music',
    question: 'Hoe voeg ik muziek toe?',
    answer: [
      'Ga naar Studiemuziek en plak een link naar een Spotify- of YouTube-afspeellijst, album of nummer.',
      'Geef de lijst een naam en klik op Toevoegen. Je kunt de lijst daarna direct in het scherm afspelen.',
    ],
  },
  {
    id: 'calendar',
    question: 'Wat kan ik in de kalender zien?',
    answer: [
      'De kalender toont je examens per maand. Klik op een dag om de planning van die dag te zien.',
    ],
  },
  {
    id: 'settings',
    question: 'Wat kan ik in Instellingen aanpassen?',
    answer: [
      'Je profielnaam, je schooljaar en examenperiodes, en je beschikbare studietijd per week.',
      'Wijzigingen worden opgeslagen zodra je op de knop van het onderdeel klikt.',
    ],
  },
];

export const HELP_ERRORS: HelpTopic[] = [
  {
    id: 'login-failed',
    question: 'Inloggen lukt niet',
    answer: [
      'Controleer of je e-mailadres en wachtwoord kloppen en of je al een account hebt aangemaakt.',
      'Heb je net een account gemaakt? Probeer dan eerst in te loggen in plaats van opnieuw te registreren.',
    ],
  },
  {
    id: 'save-failed',
    question: 'Ik krijg de melding dat iets niet is opgeslagen',
    answer: [
      'Dit gebeurt meestal door een tijdelijke verbindingsfout. Controleer je internetverbinding en probeer het opnieuw.',
      'Blijft de melding komen? Ververs de pagina en controleer of je wijziging er nog is voordat je opnieuw opslaat.',
    ],
  },
  {
    id: 'page-load-failed',
    question: 'Een lijst laadt niet of blijft leeg',
    answer: [
      'Klik op Opnieuw proberen als die knop verschijnt. Dat haalt de gegevens opnieuw op.',
      'Ververs anders de pagina. Blijft het probleem bestaan, log dan even uit en weer in.',
    ],
  },
  {
    id: 'music-invalid-link',
    question: 'Mijn muziek-link wordt niet geaccepteerd',
    answer: [
      'Gebruik een directe link naar een Spotify-afspeellijst, album of nummer, of een YouTube-video of afspeellijst.',
      'Links naar andere websites of naar de Spotify-app worden niet ondersteund. Kopieer de link vanuit de webversie van Spotify of YouTube.',
    ],
  },
  {
    id: 'music-not-playing',
    question: 'De muziek speelt niet af in het scherm',
    answer: [
      'Sommige accounts of landen blokkeren het inbedden van muziek. In dat geval kun je de lijst openen via de originele dienst.',
      'Controleer ook of je browser geluid toestaat voor deze pagina.',
    ],
  },
  {
    id: 'exam-date',
    question: 'Mijn examen staat op de verkeerde dag',
    answer: [
      'Open het examen via het vak en pas de datum of het tijdstip aan.',
      'Controleer of het examen bij het juiste vak en de juiste examenperiode hoort.',
    ],
  },
];
