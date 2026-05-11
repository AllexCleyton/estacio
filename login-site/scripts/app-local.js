// REGISTRO 
// ========================== 
const registerForm = document.getElementById("registerForm"); 
if (registerForm) { 
registerForm.addEventListener("submit", function (e) { 
e.preventDefault(); 
const name = document.getElementById("name").value; 
const email = document.getElementById("email").value; 
const password = document.getElementById("password").value; 
// salvar no localStorage 
const user = { 
name, 
email, 
password 
}; 
localStorage.setItem("user", JSON.stringify(user)); 
alert("Usuário cadastrado com sucesso!"); 
// redireciona para login 
window.location.href = "index.html"; 
}); 
} 
// ========================== 
// LOGIN 
// ========================== 
const loginForm = document.getElementById("loginForm"); 
if (loginForm) { 
loginForm.addEventListener("submit", function (e) { 
e.preventDefault(); 
const email = document.getElementById("email").value; 
const password = document.getElementById("password").value; 
const storedUser = JSON.parse(localStorage.getItem("user")); 
if (!storedUser) { 
alert("Nenhum usuário cadastrado!"); 
} 
return; 
if (email === storedUser.email && password === storedUser.password) { 
alert("Login realizado com sucesso!"); 
} else { 
alert("E-mail ou senha incorretos!"); 
} 
}); 
}