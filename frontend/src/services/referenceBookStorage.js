
const DB_NAME = "LearnWiseReferenceLibrary";
const DB_VERSION = 1;
const STORE_NAME = "books";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });

        store.createIndex("ownerId", "ownerId", {
          unique: false
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a book and its PDF
export async function saveReferenceBook(book) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    transaction.objectStore(STORE_NAME).add(book);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// Get books belonging to the current student
export async function getReferenceBooks(ownerId) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      const books = request.result.filter(
        (book) => book.ownerId === ownerId
      );

      resolve(books.sort(
        (a, b) => b.createdAt - a.createdAt
      ));
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// Delete only the current student's book
export async function deleteReferenceBook(id, ownerId) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const book = request.result;

      if (book && book.ownerId === ownerId) {
        store.delete(id);
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}


export async function updateReferenceBook(id, ownerId, updates) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    let bookFound = false;

    request.onsuccess = () => {
      const book = request.result;

      if (book && book.ownerId === ownerId) {
        bookFound = true;

        store.put({
          ...book,
          ...updates
        });
      }
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();

      if (bookFound) {
        resolve(true);
      } else {
        reject(new Error("Reference book not found."));
      }
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
