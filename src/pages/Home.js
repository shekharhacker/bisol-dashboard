import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../Logo.png";

const Home = ({ user, setUser }) => {
  const [previousPrompts] = useState([
    "Sales report Q1",
    "Customer demographics",
    "Inventory status"
  ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Reload user name from localStorage if needed
    if (!user && localStorage.getItem("bisolUser")) {
      const stored = JSON.parse(localStorage.getItem("bisolUser"));
      setUser && setUser(stored);
    }
  }, [user, setUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file && !fileList.some(f => f.name === file.name)) {
      setFileList([...fileList, file]);
    }
  };
  const handleDropdownChange = (e) => {
    const fname = e.target.value;
    const file = fileList.find(f => f.name === fname) || null;
    setSelectedFile(file);
  };
  const handleGenerate = () => {
    if (!selectedFile || !prompt) {
      alert("Please select a file and enter a prompt!");
      return;
    }
    alert(`Dashboard for "${selectedFile.name}" with prompt: ${prompt}`);
  };

  return (
    <div className="container">
      <header className="topbar">
        <div className="logo-greeting-area">
          <img src={logo} alt="BiSol Logo" />
          <span className="logo-text">BiSol</span>
          <span className="greeting-text">Welcome, {user ? user.name : ""}</span>
        </div>
        <div className="account-dropdown">
          <button className="account-btn" onClick={() => setShowMenu(prev => !prev)}>
            Account ▼
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item"
                onClick={() => {
                  localStorage.removeItem("bisolUser");
                  setUser && setUser(null);
                  setShowMenu(false);
                  window.location.reload();
                }}>Sign Out</div>
              <div className="dropdown-item"
                onClick={() => {
                  localStorage.removeItem("bisolUser");
                  setUser && setUser(null);
                  setShowMenu(false);
                  window.location.reload();
                }}>Add Another Account</div>
            </div>
          )}
        </div>
      </header>
      <div className="main-layout">
        <aside className="sidebar">
          <h3>Previous Chats / Prompts</h3>
          <ul>
            {previousPrompts.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </aside>
        <main className="main-content">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
            <div className="form-section">
              <label>Select Excel/CSV File</label>
              <select
                value={selectedFile ? selectedFile.name : ""}
                onChange={handleDropdownChange}
              >
                <option value="">Choose existing file...</option>
                {fileList.map((file, idx) => (
                  <option key={idx} value={file.name}>{file.name}</option>
                ))}
              </select>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <div className="selected-file">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
            <div className="form-section">
              <label>Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your dashboard needs..."
              />
            </div>
            <button type="submit" className="generate-btn">Generate Dashboard</button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Home;
