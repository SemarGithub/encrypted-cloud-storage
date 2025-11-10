// === KONEKSI KE SUPABASE ===
const { createClient } = window.supabase;
const supabase = createClient(
  "https://gdcunyctbofxewtxokrg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY3VueWN0Ym9meGV3dHhva3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODk4NjYsImV4cCI6MjA3ODM2NTg2Nn0.9SfCpJxx8HByLSJ3BsJ1FjwkzY3jnOxhIcLuUm_IkPI"
);


// === INISIALISASI CRYPTOJS ===
const CryptoJS = window.CryptoJS;

// === AMBIL ELEMEN DOM ===
const authSection = document.getElementById("auth-section");
const uploadSection = document.getElementById("upload-section");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const fileInput = document.getElementById("file-input");
const keyInput = document.getElementById("key");
const uploadBtn = document.getElementById("encrypt-upload");
const userEmail = document.getElementById("user-email");
const output = document.getElementById("output");
const downloadLink = document.getElementById("download-link");

// === AUTH LOGIN / REGISTER ===
loginBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });
  if (error) alert("Login gagal: " + error.message);
  else location.reload();
});

registerBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });
  if (error) alert("Registrasi gagal: " + error.message);
  else alert("Registrasi berhasil! Silakan login.");
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

// === CEK STATUS LOGIN ===
async function checkUser() {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    authSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    userEmail.textContent = "Login sebagai: " + data.user.email;
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
  }
}
checkUser();

// === ENKRIPSI DAN UPLOAD ===
uploadBtn.addEventListener("click", async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return alert("Harus login dulu!");

  const file = fileInput.files[0];
  const key = keyInput.value;
  if (!file || !key) return alert("Lengkapi semua data!");

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // Enkripsi AES
      const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
      const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();

      // Ubah ke blob agar bisa diupload
      const blob = new Blob([encrypted], { type: "text/plain" });

      // Upload ke Supabase Storage
      const filePath = `${userData.user.id}/${file.name}.enc`;
      const { error } = await supabase.storage
        .from("secure-files")
        .upload(filePath, blob, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("secure-files")
        .getPublicUrl(filePath);

      // Tampilkan link
      downloadLink.textContent = publicUrl.publicUrl;
      downloadLink.href = publicUrl.publicUrl;
      output.classList.remove("hidden");
      alert("File terenkripsi dan berhasil diupload!");
    } catch (err) {
      alert("Gagal upload: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
});
