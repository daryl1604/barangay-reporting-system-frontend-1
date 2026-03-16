import { useState } from "react";
import API from "../../api/axios";
import "../../App.css";
import loginImage from "../../assets/login-image.png";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);

      const role = res.data.user.role;

      if (role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/resident";
      }

    } catch (err) {
      alert("Invalid login credentials");
    }
  };

    return (
      <div className="login-container">

        {/* LEFT IMAGE */}
        <div className="login-left">
          <img src={loginImage} alt="Barangay Building" />
          <div className="overlay"></div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right">

          <form className="login-form" onSubmit={handleLogin}>

            <h2>Login</h2>
            <p className="login-subtext">
              Welcome back! Please login to your account.
            </p>

            <label>Email</label>
            <input
              type="email"
              placeholder="username@brs.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>

          </form>

        </div>
      </div>
    );
}

export default Login;