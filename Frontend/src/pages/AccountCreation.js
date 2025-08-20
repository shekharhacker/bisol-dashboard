import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AccountCreation = ({ setUser }) => {
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Handle user account creation form submission
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    // Password is not sent to backend per current backend code (consider security)
    // You might want to handle password securely in backend or via auth service

    try {
      const res = await fetch("http://127.0.0.1:8000/create-user", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        setUser({ name, email });
        navigate("/");
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-acc-container">
      <form className="inline-acc-form" onSubmit={handleCreateAccount}>
        <h2>Create Account</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default AccountCreation;
