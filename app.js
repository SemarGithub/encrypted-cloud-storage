// === KONEKSI KE SUPABASE ===
const { createClient } = window.supabase;
const supabase = createClient(
  "https://gdcunyctbofxewtxokrg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY3VueWN0Ym9meGV3dHhva3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODk4NjYsImV4cCI6MjA3ODM2NTg2Nn0.9SfCpJxx8HByLSJ3BsJ1FjwkzY3jnOxhIcLuUm_IkPI"
);

const CryptoJS = window.CryptoJS;

// === DOM ===
const authSection = document.getElementById("auth-section");
const uploadSection = document.getElementById("upload-section");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const helpSection = document.getElementById("help-section");
const userEmail = document.getElementById("user-email");
const fileInput = document.getElementById("file-input");
const keyInput = document.getElementById("key");
const uploadBtn = document.getElementById("encrypt-upload");
const output = document.getElementById("output");
const downloadLink = document.getElementById("download-link");
const fileList = document.getElementById("file-list");

// === UTIL: konversi WordArray <-> Uint8Array ===
function wordArrayToUint8Array(wordArray) {
  // wordArray: CryptoJS.lib.WordArray
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  let idx = 0;
  for (let i = 0; i < words.length; i++) {
    // setiap word adalah 32 bit (4 bytes), big-endian
    const word = words[i];
    // ambil 4 byte
    const b0 = (word >>> 24) & 0xff;
    const b1 = (word >>> 16) & 0xff;
    const b2 = (word >>> 8) & 0xff;
    const b3 = word & 0xff;
    if (idx < sigBytes) u8[idx++] = b0;
    if (idx < sigBytes) u8[idx++] = b1;
    if (idx < sigBytes) u8[idx++] = b2;
    if (idx < sigBytes) u8[idx++] = b3;
    if (idx >= sigBytes) break;
  }
  return u8;
}

// === VALIDASI EMAIL ===
function isRealEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === REGISTER ===
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!isRealEmail(email)) {
    return alert("Email tidak valid, gunakan email asli");
  }

  // cek apakah sudah ada dengan endpoint signUp (lebih andal dibanding memanggil signInWithPassword)
  // Kita coba daftar; jika sudah terdaftar Supabase akan memberi tahu error email already registered.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: pass });
  if (signUpError) {
    // jika sudah terdaftar, beritahu user agar login
    if (signUpError.message && signUpError.message.toLowerCase().includes("already")) {
      return alert("Email sudah terdaftar, silahkan login");
    }
    return alert("Registrasi gagal: " + signUpError.message);
  }

  alert("Registrasi berhasil! Silakan cek email kamu dan klik link verifikasi sebelum login.");
});

// === LOGIN ===
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!isRealEmail(email)) {
    return alert("Login gagal, email tidak terdaftar");
  }

  // coba login
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

  if (error) {
    // beda pesan tergantung error
    if (error.message && error.message.toLowerCase().includes("invalid login credentials")) {
      return alert("Email belum terdaftar, registrasi terlebih dahulu");
    }
    // jika akun belum diverifikasi, Supabase biasanya tetap mengizinkan sign-in, tapi cek di project Anda
    return alert("Login gagal: " + error.message);
  }

  // reload atau update UI
  location.reload();
});

// === LOGOUT ===
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

// === CEK STATUS LOGIN ===
async function checkUser() {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    authSection.classList.add("hidden");
    if (helpSection) helpSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    userEmail.textContent = "Login sebagai: " + data.user.email;

    // cek verifikasi jika Anda menyimpan email_confirmed_at di metadata (beberapa setup supabase)
    if (data.user && data.user.email && data.user.email_confirmed_at === undefined) {
      // beberapa setup Supabase tidak expose field ini langsung; jika tidak ada, abaikan
    } else if (data.user.email_confirmed_at === null) {
      alert("Email belum diverifikasi. Cek email kamu terlebih dahulu.");
      uploadBtn.disabled = true;
      return;
    } else {
      uploadBtn.disabled = false;
    }

    await listUserFiles(data.user.id);
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
  }
}
checkUser();

// === ENKRIPSI & UPLOAD ===
uploadBtn.addEventListener("click", async () => {
  const { data: session } = await supabase.auth.getUser();
  if (!session?.user) return alert("Harus login!");

  const file = fileInput.files[0];
  const key = keyInput.value;

  if (!file || !key) return alert("Lengkapi semua data!");

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // baca file menjadi Uint8Array
      const bytes = new Uint8Array(e.target.result);

      // ubah ke WordArray CryptoJS
      const wordArray = CryptoJS.lib.WordArray.create(bytes);

      // encrypt -> menghasilkan string base64 (CipherParams -> toString)
      const encryptedBase64 = CryptoJS.AES.encrypt(wordArray, key).toString();

      // simpan teks base64 ciphertext ke storage
      const blob = new Blob([encryptedBase64], { type: "text/plain;charset=utf-8" });
      const path = `${session.user.id}/${file.name}.enc`;

      const { error } = await supabase.storage
        .from("secure-files")
        .upload(path, blob, { upsert: true });

      if (error) throw error;

      alert("File terenkripsi & berhasil diupload!");
      await listUserFiles(session.user.id);
    } catch (err) {
      console.error(err);
      alert("Gagal upload: " + (err.message || JSON.stringify(err)));
    }
  };

  reader.readAsArrayBuffer(file);
});

// === LIST FILE ===
async function listUserFiles(uid) {
  const { data } = await supabase.storage.from("secure-files")
    .list(uid, { limit: 200 });

  fileList.innerHTML = "";

  if (!data || data.length === 0) {
    fileList.innerHTML = "<p>Belum ada file.</p>";
    return;
  }

  data.forEach(file => {
    const row = document.createElement("div");
    row.className = "file-row";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;

    const dl = document.createElement("button");
    dl.className = "file-download-btn";
    dl.textContent = "Download";

    dl.addEventListener("click", () => downloadDecryptedFile(`${uid}/${file.name}`, file.name));

    row.appendChild(name);
    row.appendChild(dl);
    fileList.appendChild(row);
  });
}

// === DOWNLOAD & DEKRIPSI ===
async function downloadDecryptedFile(path, filename) {
  const key = prompt("Masukkan kunci enkripsi:");
  if (!key) return;

  try {
    // download blob dari storage
    const { data: blobData, error: downloadError } = await supabase.storage.from("secure-files").download(path);
    if (downloadError) throw downloadError;

    // kita simpan ciphertext (base64) sebagai teks saat upload, sehingga ambil .text()
    const ciphertextBase64 = await blobData.text();

    // dekripsi -> menghasilkan WordArray plain
    const decryptedWordArray = CryptoJS.AES.decrypt(ciphertextBase64, key);

    // jika kunci salah atau dekripsi gagal, sigBytes bisa 0
    if (!decryptedWordArray || !decryptedWordArray.sigBytes || decryptedWordArray.sigBytes === 0) {
      return alert("Gagal dekripsi: kunci salah atau file tidak valid.");
    }

    // konversi WordArray ke Uint8Array
    const plainBytes = wordArrayToUint8Array(decryptedWordArray);

    // buat blob dan unduh
    const plainBlob = new Blob([plainBytes], { type: "application/octet-stream" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(plainBlob);
    a.download = filename.replace(/\.enc$/i, "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    alert("Gagal download atau dekripsi: " + (err.message || JSON.stringify(err)));
  }
}
