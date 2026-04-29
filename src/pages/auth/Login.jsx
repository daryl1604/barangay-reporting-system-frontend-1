import { useState } from "react";
import API from "../../api/axios";
import "../../App.css";
import loginImage from "../../assets/login-image.png";
import { normalizeResidentUser } from "../../utils/userUtils";

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

      const normalizedUser = normalizeResidentUser(res.data.user);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      const role = normalizedUser.role;

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
    <div className="login-shell">
      <div className="login-container">
        <section className="login-left">
          <img src={loginImage} alt="Barangay Building" />
          <div className="overlay" />
          <div className="login-brand" aria-label="Barangay Monitoring System">
            <div className="login-brand__text">
              <strong>Barangay Incident Reporting System</strong>
            </div>
          </div>
        </section>

        <section className="login-right">
          <div className="login-panel">
            <div className="login-panel__badge">Secure Access</div>
            <form className="login-form" onSubmit={handleLogin}>
              <h2>Welcome Back</h2>
              <p className="login-subtext">
                Sign in to continue.
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
        </section>
      </div>
    </div>
  );
}

export default Login;
