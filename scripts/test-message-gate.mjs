// Contact / voice-note unlock gate regression suite. Run: npm run gate:test
// "3 meaningful messages each": every supported script must be able to count, plain filler must not.
import { loadLib } from './lib/load-ts.mjs';

const { isSubstantiveMessage, evaluateSubstantiveConversation } = await loadLib('moderation');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));
const yes = (label, text) => ok(`counts: ${label}`, isSubstantiveMessage(text, 15));
const no = (label, text) => ok(`does not count: ${label}`, !isSubstantiveMessage(text, 15));

// Spaced Latin scripts behave exactly as before
yes('English question', 'How was your day today?');
yes('Tagalog sentence', 'Kumusta ang araw mo ngayon');
yes('Vietnamese sentence', 'Hôm nay bạn thế nào rồi?');
yes('Indonesian sentence', 'Lagi ngapain hari ini?');
no('hi', 'hi');
no('ok', 'ok');
no('two words', 'good morning');
no('short Tagalog', 'Kumusta ka na?');
no('repeated word', 'hi hi hi hi hi hi');
no('keysmash', 'asdfghjklqwertyuiop');
no('empty', '   ');

// Scripts written without spaces used to read as one word and never counted
yes('Chinese sentence', '你好，今天过得怎么样');
yes('Chinese, longer', '我今天去了咖啡店，天气很好');
no('Chinese two characters', '你好');
no('Chinese ok', '好的');
no('Chinese repeated', '哈哈哈哈哈哈哈哈哈');
yes('Japanese sentence', 'こんにちは、今日はどうですか');
no('Japanese yes', 'はい');
yes('Thai sentence', 'วันนี้ทำอะไรอยู่บ้างคะ');
no('Thai greeting', 'สวัสดีค่ะ');
yes('Khmer sentence', 'សួស្តី អ្នកសុខសប្បាយជាទេ');
no('Khmer greeting', 'សួស្តី');
yes('Korean with spaces', '안녕하세요 오늘 어때요');
no('Korean one word', '안녕하세요');

// Whole conversations
const turn = (sender_id, content) => ({ sender_id, content });
const run = (msgs) => evaluateSubstantiveConversation(msgs, 'me', 'them', 15, 3);
const zh = ['你好，今天过得怎么样', '我今天去了咖啡店散步', '周末你有什么打算呢'];
ok('three Chinese messages each unlock the gate', run([...zh.map((c) => turn('me', c)), ...zh.map((c) => turn('them', c + '？'))]).isUnlocked);
ok('one side alone does not', !run(zh.map((c) => turn('me', c))).isUnlocked);
const en = ['How was your day today?', 'Do you like living in Cebu?', 'What do you do on weekends?'];
ok('three English messages each unlock it', run([...en.map((c) => turn('me', c)), ...en.map((c) => turn('them', c))]).isUnlocked);
ok('the same message sent three times counts once', run([turn('me', en[0]), turn('me', en[0]), turn('me', en[0]), ...en.map((c) => turn('them', c))]).senderSubstantiveCount === 1);
ok('short replies never count however many there are', run(Array.from({ length: 10 }, (_, i) => turn('them', 'ok' + '!'.repeat(i % 3)))).receiverSubstantiveCount === 0);
const mixed = run([turn('me', zh[0]), turn('me', en[0]), turn('me', 'Kumusta ang araw mo ngayon'), turn('them', zh[1]), turn('them', en[1]), turn('them', 'ผมไปตลาดมาวันนี้ครับ')]);
ok('mixed scripts all count', mixed.isUnlocked && mixed.senderSubstantiveCount === 3 && mixed.receiverSubstantiveCount === 3);

console.log(`Message gate: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(' FAIL ' + f);
  process.exit(1);
}
