import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../Logo.png";

const Home = ({ user, setUser }) => {
  const [previousPrompts, setPreviousPrompts] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Fetch history from backend
  useEffect(() => {
    if (user?.email) {
      fetch(`http://127.0.0.1:8000/get-history/${user.email}`)
        .then(res => res.json())
        .then(data => setPreviousPrompts((data.history || []).map(h => h.prompt)))
        .catch(() => setPreviousPrompts([]));
    }
  }, [user]);

  // Upload file to backend
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setSelectedFile(file);
        setFileList([...fileList, file]);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      alert("Error uploading: " + err.message);
    }
  };

  const handleDropdownChange = (e) => {
    const fname = e.target.value;
    setSelectedFile(fileList.find(f => f.name === fname) || null);
  };

  // Generate dashboard
  const handleGenerate = async () => {
    if (!selectedFile || !prompt) {
      alert("Please select file & enter a prompt");
      return;
    }
    const formData = new FormData();
    formData.append("user_email", user.email);
    formData.append("prompt", prompt);
    formData.append("file_name", selectedFile.name);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-dashboard", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Dashboard generated!");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="container">
      <header className="topbar">
        <div className="logo-greeting-area">
          <img src={logo} alt="BiSol Logo" />
          <span className="logo-text">BiSol</span>
          <span className="greeting-text">Welcome, {user?.name}</span>
        </div>
        <div className="account-dropdown">
          <button className="account-btn" onClick={() => setShowMenu(p => !p)}>
            Account ▼
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => { setUser(null); window.location = "/account"; }}>Sign Out</div>
              <div className="dropdown-item" onClick={() => { setUser(null); window.location = "/account"; }}>Add Another Account</div>
            </div>
          )}
        </div>
      </header>
      <div className="main-layout">
        <aside className="sidebar">
          <h3>Previous Chats / Prompts</h3>
          <ul>
            {previousPrompts.map((p, idx) => <li key={idx}>{p}</li>)}
          </ul>
        </aside>
        <main className="main-content">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
            <div className="form-section">
              <label>Select Excel/CSV File</label>
              <select value={selectedFile ? selectedFile.name : ""} onChange={handleDropdownChange}>
                <option value="">Choose existing file...</option>
                {fileList.map((f, i) => (
                  <option key={i} value={f.name}>{f.name}</option>
                ))}
              </select>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              {selectedFile && <div className="selected-file">Selected: {selectedFile.name}</div>}
            </div>
            <div className="form-section">
              <label>Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Your dashboard request..." />
            </div>
            <button type="submit" className="generate-btn">Generate Dashboard</button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Home;
