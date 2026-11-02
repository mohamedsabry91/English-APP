// Small word lists for the rule-based checker. Kept short on purpose: the checker
// should only flag what it is sure about.

export const SUBJECT_PRONOUNS = new Set(['i', 'he', 'she', 'we', 'they']);
/** "it" and "you" can also be objects, so they count as subjects only at the start of a clause. */
export const MAYBE_SUBJECT = new Set(['it', 'you']);

export const AUX = new Set([
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', "i'm", "he's", "she's", "it's", "we're", "they're", "you're",
  'do', 'does', 'did', "don't", "doesn't", "didn't", 'will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'must',
  'has', 'have', 'had', "won't", "can't", 'cannot', "isn't", "aren't", "wasn't", "weren't", 'to', 'let', 'make', 'help', 'that', 'not',
]);

export const JOBS = new Set([
  'engineer', 'teacher', 'doctor', 'nurse', 'student', 'manager', 'driver', 'architect', 'accountant', 'technician', 'electrician',
  'plumber', 'farmer', 'pharmacist', 'dentist', 'surveyor', 'designer', 'programmer', 'developer', 'mechanic', 'lawyer', 'pilot',
  'chef', 'employee', 'officer', 'consultant', 'supervisor', 'contractor', 'inspector', 'operator', 'secretary', 'researcher',
  'lecturer', 'professor', 'clerk', 'journalist', 'translator', 'carpenter', 'tailor', 'baker', 'builder', 'scientist', 'analyst',
  'geologist', 'trainee', 'intern', 'engineering student',
]);

/** Adjectives before a job that still need an article: "She is good teacher". */
export const JOB_ADJ = new Set(['good', 'new', 'young', 'old', 'great', 'civil', 'mechanical', 'electrical', 'chemical', 'senior', 'junior', 'experienced', 'excellent', 'structural', 'site', 'project', 'water', 'software', 'english', 'math']);

/** Adjectives that are not also common verbs. Used for missing be. */
export const ADJ_STRICT = new Set([
  'tired', 'happy', 'busy', 'ready', 'late', 'hungry', 'thirsty', 'sick', 'ill', 'absent', 'available', 'sure', 'sorry', 'angry', 'sad',
  'here', 'interested', 'responsible', 'afraid', 'glad', 'able', 'unable', 'upset', 'broken', 'new', 'young', 'old', 'tall', 'hot',
  'cold', 'big', 'small', 'good', 'bad', 'great', 'important', 'necessary', 'difficult', 'easy', 'expensive', 'cheap', 'safe',
  'dangerous', 'full', 'ok', 'okay', 'nervous', 'worried', 'excited', 'satisfied', 'happy', 'married', 'single', 'beautiful', 'strong',
  'weak', 'quiet', 'noisy', 'wet', 'dry', 'heavy', 'expensive', 'useful', 'correct', 'wrong', 'right', 'free', 'fine',
]);
/** Adjectives that may follow a pronoun directly without be in correct English (verbs), excluded from the pronoun rule. */
export const ADJ_ALSO_VERB = new Set(['free', 'fine', 'right', 'wrong', 'correct', 'married', 'tired', 'upset', 'okay', 'ok']);

export const DEGREE = new Set(['very', 'so', 'too', 'really', 'quite', 'extremely']);

export const PLACE_PREPS = new Set(['in', 'at', 'from', 'on']);
export const AFTER_PLACE_PREP = new Set(['the', 'my', 'his', 'her', 'our', 'their', 'your', 'a', 'an', 'home', 'work', 'school', 'office', 'site']);

export const DETERMINERS = new Set(['the', 'my', 'his', 'her', 'our', 'their', 'your', 'this', 'that', 'each', 'every']);
export const POSSESSIVES = new Set(['my', 'his', 'her', 'our', 'their', 'your']);

export const PERSON_NOUNS = new Set([
  'father', 'mother', 'brother', 'sister', 'son', 'daughter', 'uncle', 'aunt', 'cousin', 'friend', 'neighbor', 'colleague', 'boss',
  'husband', 'wife', 'grandfather', 'grandmother', 'parents', 'children', 'manager', 'teacher', 'engineer', 'doctor', 'client',
  'supervisor', 'team', 'company',
]);

/** Collective or plural-meaning nouns: skip agreement checks. */
export const COLLECTIVE = new Set(['data', 'people', 'police', 'staff', 'team', 'media', 'family', 'crew', 'public', 'government', 'management', 'committee', 'children', 'men', 'women', 'parents', 'series', 'news', 'majority']);

/** Base verbs that are wrong straight after he/she/it in the present simple. Verbs with the same past form (put, read, cut...) are left out. */
export const BASE_VERBS = new Set([
  'go', 'have', 'do', 'work', 'need', 'want', 'like', 'live', 'make', 'take', 'come', 'know', 'think', 'say', 'get', 'show', 'use',
  'start', 'finish', 'eat', 'drink', 'study', 'teach', 'write', 'check', 'send', 'visit', 'help', 'speak', 'understand', 'look',
  'seem', 'mean', 'include', 'require', 'contain', 'cause', 'depend', 'belong', 'agree', 'give', 'leave', 'arrive', 'wait', 'travel',
  'prefer', 'believe', 'remember', 'forget', 'try', 'pay', 'buy', 'call', 'ask', 'answer', 'watch', 'fix', 'run', 'see', 'meet',
  'love', 'drive', 'explain', 'provide', 'describe', 'become', 'happen', 'allow', 'consist', 'connect', 'carry', 'reach', 'produce',
  'stay', 'sell', 'wake', 'sleep', 'feel', 'enjoy', 'plan', 'design', 'test', 'measure', 'install', 'repair', 'prepare',
]);
/** Base verbs safe after a noun subject (rarely nouns themselves, so "the site visit" does not trigger). */
export const BASE_VERBS_AFTER_NOUN = new Set([
  'go', 'have', 'do', 'make', 'take', 'come', 'know', 'think', 'get', 'show', 'seem', 'mean', 'include', 'require', 'contain', 'depend',
  'belong', 'agree', 'give', 'leave', 'arrive', 'prefer', 'believe', 'remember', 'forget', 'buy', 'ask', 'send', 'speak', 'understand',
  'teach', 'write', 'eat', 'drink', 'live', 'like', 'want', 'need', 'provide', 'explain', 'describe', 'become', 'happen', 'allow', 'consist',
]);

export const THIRD_PERSON_S = new Set(['works', 'goes', 'has', 'needs', 'wants', 'likes', 'knows', 'makes', 'takes', 'comes', 'lives', 'does', 'says', 'gets', 'shows', 'uses', 'starts', 'finishes', 'eats', 'drinks', 'studies', 'teaches', 'writes', 'checks', 'sends', 'visits', 'helps', 'speaks']);

/** Past forms that are wrong after did / didn't. */
export const PAST_FORMS = new Set(['went', 'saw', 'came', 'took', 'made', 'wrote', 'ate', 'bought', 'sent', 'had', 'gave', 'knew', 'thought', 'said', 'got', 'met', 'spoke', 'left', 'told', 'found', 'drove', 'began', 'brought', 'built', 'felt', 'understood']);
export const ED_NOT_PAST = new Set(['need', 'feed', 'seed', 'bleed', 'speed', 'proceed', 'succeed', 'exceed', 'breed', 'shed', 'bed', 'red', 'wed']);

export const PAST_MARKERS = ['yesterday', 'ago', 'last'];

export const TIME_ADVERBS = new Set(['yesterday', 'today', 'tomorrow', 'tonight']);
export const LIKE_VERBS = new Set(['like', 'love', 'want', 'enjoy', 'need', 'appreciate', 'hope', 'thank', 'prefer', 'hate']);

/** Common adjectives for "a car new" (adjective after the noun). */
export const POST_ADJ = new Set(['new', 'big', 'small', 'old', 'good', 'long', 'short', 'large', 'beautiful', 'red', 'white', 'black', 'blue', 'green', 'clean', 'modern', 'tall', 'nice', 'cheap', 'expensive', 'busy', 'quiet']);

export const SILENT_H = ['hour', 'honest', 'honor', 'honour', 'heir', 'herb'];
/** Words starting with a vowel letter but a consonant sound. */
export const VOWEL_LETTER_CONSONANT_SOUND = /^(uni(?!nt|mp|nf|nh|ns|nv|nd)|use|usu|uti|ura|ure|uro|euro|eur|eu|ewe|one|once|ufo|ubiq|ute)/;
/** Words starting with "u" that do start with a vowel sound. */
export const U_VOWEL = /^(un|up|ug|ult|umb|um|us$|ush|utt|upp)/;
/** Acronyms said letter by letter that start with a vowel sound. */
export const AN_ACRONYMS = new Set(['msc', 'mba', 'ma', 'mri', 'hr', 'ngo', 'led', 'sms', 'hvac', 'faq', 'ms', 'mp', 'x-ray', 'fbi', 'rfi', 'rfq', 'sop', 'hse', 'nde', 'mep', 'ltd']);
/** Words after which a capital A is a label (Block A), not an article. */
export const LABEL_WORDS = new Set(['part', 'grade', 'type', 'option', 'class', 'section', 'plan', 'block', 'zone', 'level', 'vitamin', 'phase', 'building', 'gate', 'room', 'line', 'tank', 'unit']);

export const DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
export const NUMBER_WORDS = new Set(['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'several', 'many', 'few', 'a', 'one']);
export const DURATION_UNITS = new Set(['year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days', 'hour', 'hours', 'minute', 'minutes', 'long']);

/** Common misspellings. Unknown words are never flagged. */
export const MISSPELLINGS: Record<string, string> = {
  recieve: 'receive', recieved: 'received', beleive: 'believe', wich: 'which', untill: 'until', tommorow: 'tomorrow', tomorow: 'tomorrow',
  tommorrow: 'tomorrow', accomodation: 'accommodation', adress: 'address', enviroment: 'environment', goverment: 'government',
  definately: 'definitely', seperate: 'separate', seperately: 'separately', occured: 'occurred', begining: 'beginning', wensday: 'Wednesday',
  wednsday: 'Wednesday', febuary: 'February', freind: 'friend', freinds: 'friends', beacuse: 'because', becuase: 'because', becouse: 'because',
  bacause: 'because', thier: 'their', alot: 'a lot', calender: 'calendar', conection: 'connection', comittee: 'committee',
  necesary: 'necessary', neccessary: 'necessary', neccesary: 'necessary', sucess: 'success', succes: 'success', profesional: 'professional',
  responsable: 'responsible', maintainance: 'maintenance', maintenence: 'maintenance', maintenace: 'maintenance', mesurement: 'measurement',
  measurment: 'measurement', lenght: 'length', hieght: 'height', heigth: 'height', widht: 'width', wieght: 'weight', temprature: 'temperature',
  tempreture: 'temperature', presure: 'pressure', schedual: 'schedule', shedule: 'schedule', enginer: 'engineer', engeneer: 'engineer',
  enginner: 'engineer', engeener: 'engineer', enginering: 'engineering', engeneering: 'engineering', managment: 'management',
  equipement: 'equipment', recomend: 'recommend', reccomend: 'recommend', acheive: 'achieve', arguement: 'argument', quantaty: 'quantity',
  quallity: 'quality', qualty: 'quality', bulding: 'building', buliding: 'building', sincerly: 'sincerely', plese: 'please',
  wating: 'waiting', writting: 'writing', comming: 'coming', diffrent: 'different', diffrence: 'difference', importent: 'important',
  intresting: 'interesting', knowlege: 'knowledge', libary: 'library', probaly: 'probably', realy: 'really', finaly: 'finally',
  begger: 'bigger', togather: 'together', whith: 'with', wat: 'what', becarful: 'be careful', carefull: 'careful', usefull: 'useful',
  successfull: 'successful', helpfull: 'helpful', thankfull: 'thankful', beautifull: 'beautiful', excelent: 'excellent', exellent: 'excellent',
  experiance: 'experience', expirience: 'experience', concret: 'concrete', proffesional: 'professional', adviced: 'advised',
  reinforcment: 'reinforcement', foundaton: 'foundation', drawning: 'drawing', drawnings: 'drawings', insted: 'instead', recieving: 'receiving',
};

/** Misspellings where p and b are mixed up. */
export const PB_MISSPELLINGS: Record<string, string> = {
  blease: 'please', bleese: 'please', broblem: 'problem', broblems: 'problems', broplem: 'problem', bipe: 'pipe', bipes: 'pipes',
  beople: 'people', bicture: 'picture', bictures: 'pictures', brobably: 'probably', broject: 'project', brojects: 'projects',
  brogram: 'program', bossible: 'possible', oben: 'open', hapby: 'happy', subbort: 'support',
  subbly: 'supply', reborts: 'reports', rebort: 'report', blan: 'plan', blace: 'place', bressure: 'pressure', hosbital: 'hospital', shob: 'shop', stob: 'stop', helb: 'help', bencil: 'pencil', baber: 'paper',
};

export const UNCOUNTABLE_PLURALS: Record<string, string> = {
  informations: 'information', advices: 'advice', equipments: 'equipment', furnitures: 'furniture', knowledges: 'knowledge',
  feedbacks: 'feedback', luggages: 'luggage', baggages: 'baggage', homeworks: 'homework', softwares: 'software', hardwares: 'hardware',
  machineries: 'machinery', traffics: 'traffic', sceneries: 'scenery', researchs: 'research',
};
export const UNCOUNTABLE = new Set(['information', 'advice', 'equipment', 'furniture', 'knowledge', 'feedback', 'luggage', 'baggage', 'homework', 'software', 'machinery', 'traffic', 'research', 'news', 'progress']);

/** verb + wrong preposition → fix. */
export const VERB_PREP: { re: RegExp; fix: string; ar: string; en: string }[] = [
  { re: /^(discuss|discusses|discussed|discussing)$/, fix: 'about', ar: 'الفعل discuss لا يحتاج about بعده: discuss the plan.', en: '"Discuss" takes no "about": discuss the plan.' },
  { re: /^(mention|mentions|mentioned|mentioning)$/, fix: 'about', ar: 'الفعل mention لا يحتاج about بعده: mention the problem.', en: '"Mention" takes no "about": mention the problem.' },
  { re: /^(emphasize|emphasizes|emphasized|emphasise|emphasised)$/, fix: 'on', ar: 'الفعل emphasize لا يحتاج on بعده.', en: '"Emphasize" takes no "on".' },
];
