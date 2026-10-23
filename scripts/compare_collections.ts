import * as admin from 'firebase-admin';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function compareCollections() {
  const lettersSnap = await db.collection('letters').get();
  const letterSnap = await db.collection('letter').get();

  const lettersDocs = new Map(lettersSnap.docs.map(doc => [doc.id, doc.data()]));
  const letterDocs = new Map(letterSnap.docs.map(doc => [doc.id, doc.data()]));

  console.log(`Letters count: ${lettersDocs.size}`);
  console.log(`Letter count: ${letterDocs.size}`);

  const onlyInLetters = Array.from(lettersDocs.keys()).filter(id => !letterDocs.has(id));
  const onlyInLetter = Array.from(letterDocs.keys()).filter(id => !lettersDocs.has(id));

  console.log(`Only in 'letters': ${onlyInLetters.length}`);
  console.log(`Only in 'letter': ${onlyInLetter.length}`);
  
  if (onlyInLetters.length > 0) console.log('IDs only in letters:', onlyInLetters);
  if (onlyInLetter.length > 0) console.log('IDs only in letter:', onlyInLetter);
}

compareCollections().catch(console.error);
