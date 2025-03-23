import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export type AboutContent = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  section: 'mission' | 'story' | 'how-it-works';
  order: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Firestore data converter
const aboutConverter: FirestoreDataConverter<Omit<AboutContent, 'id'>> = {
  toFirestore(content: Omit<AboutContent, 'id'>): DocumentData {
    return {
      title: content.title,
      subtitle: content.subtitle,
      content: content.content,
      section: content.section,
      order: content.order,
      isActive: content.isActive,
      createdAt: content.createdAt instanceof Date ? Timestamp.fromDate(content.createdAt) : content.createdAt,
      updatedAt: content.updatedAt instanceof Date ? Timestamp.fromDate(content.updatedAt) : content.updatedAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AboutContent {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title,
      subtitle: data.subtitle || '',
      content: data.content,
      section: data.section,
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
    };
  }
};

export const aboutCollection = collection(db, 'about').withConverter(aboutConverter);

export async function getAboutContent(): Promise<AboutContent[]> {
  try {
    const q = query(
      aboutCollection,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const aboutContent: AboutContent[] = [];
    
    snapshot.forEach((doc) => {
      aboutContent.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return aboutContent;
  } catch (error) {
    console.error('Error fetching about content:', error);
    throw error;
  }
}

export async function addAboutContent(content: Omit<AboutContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AboutContent> {
  try {
    const timestamp = new Date();
    const docData = {
      ...content,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    const docRef = await addDoc(aboutCollection, docData);
    const newDoc = await getDoc(docRef);
    
    return {
      id: docRef.id,
      ...newDoc.data()
    } as AboutContent;
  } catch (error) {
    console.error('Error adding about content:', error);
    throw error;
  }
}

export async function updateAboutContent(id: string, content: Partial<Omit<AboutContent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Partial<AboutContent>> {
  try {
    const docRef = doc(db, 'about', id).withConverter(aboutConverter);
    const timestamp = new Date();
    const updateData = {
      ...content,
      updatedAt: timestamp
    };
    
    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    
    return {
      id,
      ...updatedDoc.data()
    } as AboutContent;
  } catch (error) {
    console.error('Error updating about content:', error);
    throw error;
  }
}
