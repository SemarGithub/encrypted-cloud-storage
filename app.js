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

  // cek apakah sudah ada
  const { data: existing } = await supabase.auth.signInWithPassword({
    email, password: pass
  }).catch(()=>({ data: null }));

  if (existing?.user) {
    return alert("Email sudah terdaftar, silahkan login");
  }

  // daftar baru
  const { error } = await supabase.auth.signUp({ email, password: pass });

  if (error) return alert("Registrasi gagal: " + error.message);

  alert("Registrasi berhasil! Silakan cek email kamu dan klik link verifikasi sebelum login.");
});

// === LOGIN ===
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!isRealEmail(email)) {
    return alert("Login gagal, email tidak terdaftar");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email, password: pass
  });

  if (error?.message.includes("Invalid login credentials")) {
    return alert("Email belum terdaftar, registrasi terlebih dahulu");
  }

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
    helpSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    userEmail.textContent = "Login sebagai: " + data.user.email;

    // cek email verifikasi
    if (!data.user.email_confirmed_at) {
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

// === UTIL BASE64 → BUFFER ===
function base64ToUint8Array(base64) {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// === ENKRIPSI & UPLOAD ===
uploadBtn.addEventListener("click", async () => {
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return alert("Harus login!");

  const file = fileInput.files[0];
  const key = keyInput.value;

  if (!file || !key) return alert("Lengkapi semua data!");

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const bytes = new Uint8Array(e.target.result);
      const wordArray = CryptoJS.lib.WordArray.create(bytes);
      const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
      const encryptedArr = base64ToUint8Array(encrypted);

      const blob = new Blob([encryptedArr], { type: "application/octet-stream" });
      const path = `${session.user.id}/${file.name}.enc`;

      const { error } = await supabase.storage.from("secure-files")
        .upload(path, blob, { upsert: true });

      if (error) throw error;

      const { data: signed } = await supabase.storage.from("secure-files")
        .createSignedUrl(path, 3600);

      downloadLink.textContent = file.name + ".enc";
      downloadLink.href = signed.signedUrl;
      output.classList.remove("hidden");

      alert("File terenkripsi & berhasil diupload!");
      await listUserFiles(session.user.id);

    } catch (err) {
      alert("Gagal upload: " + err.message);
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

// === DOWNLOAD DEKRIPSI ===
async function downloadDecryptedFile(path, filename) {
  const key = prompt("Masukkan kunci enkripsi:");
  if (!key) return;

  const { data } = await supabase.storage.from("secure-files").download(path);
  const arr = new Uint8Array(await data.arrayBuffer());
  const wordArray = CryptoJS.lib.WordArray.create(arr);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext: wordArray }, key);

  const bytes = new Uint8Array(decrypted.sigBytes);
  for (let i = 0; i < decrypted.sigBytes; i++)
    bytes[i] = decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8);

  const blob = new Blob([bytes], { type: "application/octet-stream" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.replace(".enc", "");
  a.click();
}
