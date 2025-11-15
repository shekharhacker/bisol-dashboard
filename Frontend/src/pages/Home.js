import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../assests/Logo.png";

const Home = ({ user, setUser }) => {
  const [previousPrompts, setPreviousPrompts] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Fetch history
  useEffect(() => {
    if (user?.email) {
      fetch(`http://localhost:8000/get-history/${user.email}`)
        .then((res) => res.json())
        .then((data) =>
          setPreviousPrompts((data.history || []).map((h) => h.prompt))
        )
        .catch(() => setPreviousPrompts([]));
    }
  }, [user]);

  // Upload file
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setSelectedFile(file);
        setFileList((prev) => [...prev, file]);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      alert("Error uploading: " + err.message);
    }
  };

  const handleDropdownChange = (e) => {
    const fname = e.target.value;
    setSelectedFile(fileList.find((f) => f.name === fname) || null);
  };

  // Main Generate Dashboard
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
      const res = await fetch("http://localhost:8000/generate-dashboard", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        window.latestDashboard = data.dashboard_image;
        openDashboardWindow(data);
      } else {
        alert("Dashboard generation failed.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // POPUP WINDOW FUNCTION
  function openDashboardWindow(data) {
    const dashboardImage = data.dashboard_image;
    const insights = data.insights || [];

    let win = window.open("", "_blank", "width=1400,height=900");

    win.document.write(`
        <html>
        <head>
            <title>BiSol Dashboard</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>

        <body class="bg-gray-100 p-6 text-gray-900">
            <h1 class="text-3xl font-bold mb-4 text-blue-600">
                Dashboard Preview
            </h1>

            <div class="bg-white shadow-lg rounded-lg p-4">
                <img src="data:image/png;base64,${dashboardImage}" 
                    class="rounded-lg shadow w-full"/>
            </div>

            <h2 class="text-xl font-semibold mt-6">Ask for updates</h2>

            <textarea id="updatePrompt"
                class="border w-full p-2 mt-2 rounded h-24"
                placeholder="Describe changes you want..."></textarea>

            <button onclick="window.updateDashboard()"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow">
                Regenerate Dashboard
            </button>

            <button onclick="window.downloadDashboard()"
                class="mt-4 ml-2 px-4 py-2 bg-green-600 text-white rounded shadow">
                Download Dashboard
            </button>

            <script>
                window.updateDashboard = function() {
                    const prompt = document.getElementById("updatePrompt").value;
                    if (!prompt) return alert("Enter a modification prompt first.");

                    window.opener.modifyDashboard(prompt)
                        .then(updated => {
                            window.location.reload();
                        });
                }

                window.downloadDashboard = function() {
                    const link = document.createElement("a");
                    link.href = "data:image/png;base64," + window.opener.latestDashboard;
                    link.download = "dashboard.png";
                    link.click();
                }
            </script>
        </body>
        </html>
    `);
    win.document.close();
  }

  // Backend call for regeneration
  window.modifyDashboard = async function (updatePrompt) {
    const formData = new FormData();
    formData.append("user_email", user.email);
    formData.append("prompt", updatePrompt);
    formData.append("file_name", selectedFile.name);

    const res = await fetch("http://localhost:8000/generate-dashboard", {
      method: "POST",
      body: formData,
    });

    const updatedData = await res.json();
    window.latestDashboard = updatedData.dashboard_image;
    return updatedData;
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
          <button className="account-btn" onClick={() => setShowMenu((p) => !p)}>
            Account ▼
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => {
                  setUser(null);
                  window.location = "/account";
                }}
              >
                Sign Out
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <h3>Previous Chats / Prompts</h3>
          <ul>
            {previousPrompts.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </aside>

        <main className="main-content">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
          >
            <div className="form-section">
              <label>Select Excel/CSV File</label>
              <select
                value={selectedFile ? selectedFile.name : ""}
                onChange={handleDropdownChange}
              >
                <option value="">Choose existing file...</option>
                {fileList.map((f, i) => (
                  <option key={i} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>

              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              {selectedFile && (
                <div className="selected-file">Selected: {selectedFile.name}</div>
              )}
            </div>

            <div className="form-section">
              <label>Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Your dashboard request..."
              />
            </div>

            <button type="submit" className="generate-btn">
              Generate Dashboard
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Home;
