import { ENGLISH_DICTIONARY, HINDI_DICTIONARY } from './dictionary';
import type { Draft, Duration, EnglishStage, HindiStage, Language } from './types';

export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
export const DURATION_OPTIONS: Duration[] = ['1', '2', '3'];

export const cleanToken = (value: string) => value.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
export const containsDevanagari = (value: string) => /[\u0900-\u097F]/.test(value);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getStageLabel(className: string, language: 'english'): EnglishStage;
function getStageLabel(className: string, language: 'hindi'): HindiStage;
function getStageLabel(className: string, language: Language) {
  const n = Number(className);
  if (n <= 4) return language === 'english' ? 'junior' : 'प्रारंभिक';
  if (n <= 8) return language === 'english' ? 'middle' : 'मध्य';
  return language === 'english' ? 'senior' : 'वरिष्ठ';
}

export function splitTopics(rawTopics: string) {
  return rawTopics.split(/\r?\n|,/).map((t) => t.trim()).filter(Boolean);
}

function pickParagraphs(paragraphs: string[], extra: string, duration: Duration) {
  if (duration === '1') return paragraphs.slice(0, 1);
  if (duration === '2') return [...paragraphs.slice(0, 2), extra];
  return [...paragraphs, extra];
}

export function getEstimatedLength(language: Language, duration: Duration) {
  return language === 'hindi'
    ? `लगभग ${duration} मिनट`
    : `About ${duration} minute${duration === '1' ? '' : 's'}`;
}

function collectDifficultWords(parts: string[], language: Language) {
  const text = parts.join(' ');
  const dict = language === 'hindi' ? HINDI_DICTIONARY : ENGLISH_DICTIONARY;
  return Object.values(dict).filter((entry) => {
    const pattern =
      language === 'english'
        ? new RegExp(`(^|[^\\p{L}])${escapeRegExp(entry.word.toLowerCase())}([^\\p{L}]|$)`, 'iu')
        : new RegExp(`(^|[^\\p{L}])${escapeRegExp(entry.word)}([^\\p{L}]|$)`, 'u');
    return pattern.test(language === 'english' ? text.toLowerCase() : text);
  });
}

export async function transliterateHindiTopics(topics: string[]) {
  const needsTranslit = topics.some((t) => !containsDevanagari(t) && /[a-z]/i.test(t));
  if (!needsTranslit) return topics;
  try {
    const response = await fetch('/api/transliterate/hindi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics }),
    });
    if (!response.ok) return topics;
    const data = (await response.json()) as { topics?: string[] };
    return data.topics && Array.isArray(data.topics) ? data.topics : topics;
  } catch {
    return topics;
  }
}

export function lookupWord(word: string, topic: string, language: Language) {
  const cleaned = cleanToken(word);
  const normalized = language === 'hindi' ? cleaned : cleaned.toLowerCase();
  const dict = language === 'hindi' ? HINDI_DICTIONARY : ENGLISH_DICTIONARY;
  return (
    dict[normalized] ?? {
      word: cleaned,
      meaning:
        language === 'english'
          ? `This word is used in the speech around ${topic}. Explain it in simple language while speaking.`
          : `यह शब्द ${topic} विषय के भाषण में प्रयुक्त हुआ है। बोलते समय इसका अर्थ सरल भाषा में समझाएँ।`,
      usage:
        language === 'english'
          ? 'Connect it with a daily-life example so the student can explain it naturally.'
          : 'इसे रोज़मर्रा के उदाहरण से जोड़ें ताकि छात्र इसे स्वाभाविक ढंग से समझा सके।',
    }
  );
}

export function formatDraftForDownload(draft: Draft, language: Language, className: string) {
  const header = [
    draft.title,
    language === 'english' ? `Class: ${className}` : `कक्षा: ${className}`,
    language === 'english' ? `Length: ${draft.estimatedLength}` : `अवधि: ${draft.estimatedLength}`,
    '',
  ];
  const heading = language === 'english' ? 'Extra ideas to extend the speech:' : 'भाषण बढ़ाने के लिए अतिरिक्त बिंदु:';
  const ideaLines = draft.ideas.map((idea, i) => `${i + 1}. ${idea}`);
  return [header.join('\n'), draft.intro, ...draft.paragraphs, draft.closing, '', heading, ...ideaLines].join('\n\n');
}

export function buildEnglishDraft(topic: string, className: string, duration: Duration): Draft {
  const stage = getStageLabel(className, 'english');

  const introByStage = {
    junior: `Good morning respected teachers and my dear friends. Today I would like to speak on ${topic}. This is a topic that we can understand easily from our own daily life.`,
    middle: `Good morning respected teachers and my dear friends. Today I am going to speak on ${topic}. This topic matters to students because it quietly shapes our habits, our thinking, and our behavior.`,
    senior: `Good morning respected teachers and my dear friends. Today I would like to present my thoughts on ${topic}. This is a meaningful topic because it connects personal growth with the way we live and contribute to society.`,
  } as const;

  const paragraphsByStage = {
    junior: [
      `When we think about ${topic}, we do not need very big examples. We can see it in the way children speak politely, help others, and learn from parents and teachers.`,
      `${topic} also teaches us that good habits are built step by step. Small actions done every day create confidence, discipline, and a strong character over time.`,
      `It is worth remembering that no one becomes great overnight. Every child who practices ${topic} in small ways at home and in school is already building something lasting and valuable.`,
    ],
    middle: [
      `${topic} matters because students are not only preparing for examinations, they are also preparing for life. A clear understanding of this idea helps them make better choices in school, at home, and in society.`,
      `This topic is not proved by speech alone. Its real value is seen in discipline, regular effort, responsibility, and in the respect we show to people around us.`,
      `If we connect ${topic} with real situations from daily life, it stops sounding like a lesson from a book and starts sounding like a truth we can actually live by.`,
    ],
    senior: [
      `${topic} deserves attention because it stands at the meeting point of personal values and public behavior. The way students think about such a topic influences their decisions far beyond the classroom.`,
      `On one side, ${topic} shapes discipline, judgment, responsibility, and self-confidence. On the other side, it affects the strength of families, institutions, and society as a whole.`,
      `A mature view of ${topic} is neither emotional nor extreme. It accepts practical challenges, yet it also reminds us that honest action, balance, and awareness can gradually improve real life.`,
    ],
  } as const;

  const closingByStage = {
    junior: `To conclude, ${topic} teaches us that simple good habits can make a big difference in life. If we start with small actions, we can become better children and better human beings. Thank you.`,
    middle: `To conclude, ${topic} becomes meaningful only when it appears in our actions. Good thoughts are valuable, but they matter even more when they guide our behavior. Thank you.`,
    senior: `To conclude, ${topic} is not merely a topic for speaking. It is a practical guide for responsible living. If we understand it honestly and apply it steadily, our words and actions both become more meaningful. Thank you.`,
  } as const;

  const ideasByStage = {
    junior: ['Add one example from home or school.', 'Mention one good habit connected to the topic.', 'End with one simple lesson for children.'],
    middle: ['Connect the topic with student life.', 'Use one practical example from school, family, or society.', 'Mention how values become visible in action.'],
    senior: ['Show both personal and social impact.', 'Add one realistic challenge instead of sounding one-sided.', 'End with a reflective and balanced takeaway.'],
  } as const;

  const extraByStage = {
    junior: `Children understand ${topic} better when they connect it with what they do every day. A short personal example makes the speech feel real and easy to remember.`,
    middle: `Students can strengthen this extempore by showing one practical outcome of ${topic}. When an idea is linked with action, the speech sounds more sincere and complete.`,
    senior: `A mature speech on ${topic} should also show reflection. It helps to explain not only why the topic matters, but also how thoughtful action can turn the idea into real change.`,
  } as const;

  const durationIdea = {
    '1': 'Keep the speech compact and speak with clarity.',
    '2': 'Move naturally from meaning to example.',
    '3': 'Add one more example or practical observation if time allows.',
  } as const;

  const intro = introByStage[stage];
  const paragraphs = pickParagraphs([...paragraphsByStage[stage]], extraByStage[stage], duration);
  const closing = closingByStage[stage];
  const ideas = [...ideasByStage[stage], durationIdea[duration]];

  return {
    topic,
    title: `${topic} - Class ${className} Extempore`,
    intro,
    paragraphs,
    closing,
    ideas,
    difficultWords: collectDifficultWords([intro, ...paragraphs, closing], 'english'),
    duration,
    estimatedLength: getEstimatedLength('english', duration),
  };
}

export function buildHindiDraft(topic: string, className: string, duration: Duration): Draft {
  const stage = getStageLabel(className, 'hindi');

  const introByStage = {
    प्रारंभिक: `सुप्रभात आदरणीय अध्यापकों और मेरे प्रिय साथियों। आज मैं ${topic} विषय पर बोलने जा रहा/रही हूँ। यह विषय हमारे रोज़मर्रा के जीवन से बहुत सरल तरीके से जुड़ता है।`,
    मध्य: `सुप्रभात आदरणीय अध्यापकों और मेरे प्रिय साथियों। आज मैं ${topic} विषय पर अपने विचार प्रस्तुत करना चाहता/चाहती हूँ। यह विषय छात्रों के लिए महत्वपूर्ण है क्योंकि यह उनकी सोच, आदतों और व्यवहार को प्रभावित करता है।`,
    वरिष्ठ: `सुप्रभात आदरणीय अध्यापकों और मेरे प्रिय साथियों। आज मैं ${topic} विषय पर अपने विचार रखना चाहता/चाहती हूँ। यह विषय केवल भाषण का विषय नहीं, बल्कि जीवन को समझने का एक गंभीर और उपयोगी दृष्टिकोण भी है।`,
  } as const;

  const paragraphsByStage = {
    प्रारंभिक: [
      `${topic} को समझने के लिए हमें अपने आसपास की छोटी-छोटी बातों पर ध्यान देना चाहिए। बच्चे घर, स्कूल और मित्रों से सीखते हैं कि सही व्यवहार और अच्छी आदतें कैसे बनती हैं।`,
      `${topic} हमें यह भी सिखाता है कि छोटा-सा अच्छा काम भी बहुत महत्व रखता है। सम्मान, अनुशासन और जिम्मेदारी जैसी बातें धीरे-धीरे हमारे व्यक्तित्व को मजबूत बनाती हैं।`,      `यह भी याद रखना ज़रूरी है कि कोई भी एक दिन में बड़ा नहीं बनता। जो बच्चा घर और स्कूल में ${topic} की छोटी-छोटी बातों का पालन करता है, वह अपने जीवन में कुछ टिकाऊ और मूल्यवान बना रहा होता है।`,    ],
    मध्य: [
      `${topic} महत्वपूर्ण इसलिए है क्योंकि छात्र केवल पढ़ाई के लिए नहीं, बल्कि जीवन के लिए भी तैयार हो रहे होते हैं। यह विषय उन्हें अपने विचारों को व्यवहार से जोड़ने की समझ देता है।`,
      `इसका प्रभाव हमारे रोज़ के निर्णयों में दिखाई देता है। समय का सही उपयोग, अनुशासन, जिम्मेदारी और संतुलित सोच इसी समझ का व्यावहारिक रूप हैं।`,
      `जब हम ${topic} को वास्तविक जीवन के उदाहरणों से जोड़ते हैं, तब यह विषय केवल किताबों की बात नहीं लगता, बल्कि जीवन की सच्चाई जैसा महसूस होता है।`,
    ],
    वरिष्ठ: [
      `${topic} ऐसा विषय है जो व्यक्ति और समाज दोनों को एक साथ छूता है। यह हमारे विचार, आचरण और जिम्मेदारियों के बीच गहरा संबंध स्थापित करता है।`,
      `एक ओर यह विषय व्यक्तिगत विकास से जुड़ा है, क्योंकि यह चरित्र, अनुशासन, निर्णय क्षमता और आत्मविश्वास को प्रभावित करता है। दूसरी ओर इसका असर परिवार, शिक्षा व्यवस्था और समाज पर भी पड़ता है।`,
      `इस विषय पर संतुलित दृष्टिकोण रखना जरूरी है। हमें केवल आदर्श बातों तक सीमित नहीं रहना चाहिए, बल्कि वास्तविक कठिनाइयों को स्वीकार करते हुए यह भी बताना चाहिए कि सही प्रयास से सुधार संभव है।`,
    ],
  } as const;

  const closingByStage = {
    प्रारंभिक: `अंत में मैं यही कहना चाहूँगा/चाहूँगी कि ${topic} हमें अच्छी आदतों, सही सोच और अच्छे व्यवहार की सीख देता है। यदि हम छोटी बातों से शुरुआत करें, तो बड़ा बदलाव संभव है। धन्यवाद।`,
    मध्य: `अंत में, ${topic} का महत्व तभी है जब वह हमारे व्यवहार में दिखाई दे। अच्छे विचार तब ही सच्चे लगते हैं जब वे हमारे कर्म का हिस्सा बनते हैं। धन्यवाद।`,
    वरिष्ठ: `अंत में, ${topic} केवल बोलने का विषय नहीं, बल्कि जिम्मेदार जीवन जीने की दिशा है। यदि हम इसे ईमानदारी से समझें और व्यवहार में उतारें, तो हमारे शब्द और कर्म दोनों अधिक प्रभावशाली बन सकते हैं। धन्यवाद।`,
  } as const;

  const ideasByStage = {
    प्रारंभिक: ['घर या स्कूल से एक छोटा उदाहरण जोड़ें।', 'एक अच्छी आदत का उल्लेख करें।', 'अंत में सरल सीख दें।'],
    मध्य: ['विषय को छात्र जीवन से जोड़ें।', 'घर, स्कूल या समाज का एक उदाहरण दें।', 'बताएं कि विचार व्यवहार में कैसे दिखता है।'],
    वरिष्ठ: ['व्यक्ति और समाज दोनों पर प्रभाव बताएं।', 'एक वास्तविक चुनौती का उल्लेख करें।', 'समापन में संतुलित और सोचने योग्य बात रखें।'],
  } as const;

  const extraByStage = {
    प्रारंभिक: `${topic} को अच्छे ढंग से बोलने के लिए बच्चे अपने जीवन की छोटी घटना जोड़ सकते हैं। इससे भाषण स्वाभाविक लगता है और याद रखना भी आसान हो जाता है।`,
    मध्य: `${topic} पर बोलते समय यदि छात्र एक साफ उदाहरण जोड़ें, तो श्रोता विषय को तुरंत समझ पाते हैं। विचार और व्यवहार का संबंध दिखाना भाषण को मजबूत बनाता है।`,
    वरिष्ठ: `${topic} पर प्रभावी वक्तव्य के लिए केवल विचार पर्याप्त नहीं हैं। एक परिपक्व प्रस्तुति में कारण, प्रभाव और समाधान तीनों का संतुलित उल्लेख होना चाहिए।`,
  } as const;

  const durationIdea = {
    '1': 'भाषण छोटा रखें लेकिन स्पष्ट बोलें।',
    '2': 'अर्थ से उदाहरण तक सहज रूप से बढ़ें।',
    '3': 'समय हो तो एक अतिरिक्त उदाहरण जोड़ें।',
  } as const;

  const intro = introByStage[stage];
  const paragraphs = pickParagraphs([...paragraphsByStage[stage]], extraByStage[stage], duration);
  const closing = closingByStage[stage];
  const ideas = [...ideasByStage[stage], durationIdea[duration]];

  return {
    topic,
    title: `${topic} - कक्षा ${className} हेतु वक्तव्य`,
    intro,
    paragraphs,
    closing,
    ideas,
    difficultWords: collectDifficultWords([intro, ...paragraphs, closing], 'hindi'),
    duration,
    estimatedLength: getEstimatedLength('hindi', duration),
  };
}
