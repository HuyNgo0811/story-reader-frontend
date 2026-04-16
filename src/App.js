import React, { useState, useEffect } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import ePub from "epubjs";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API = "https://story-reader-backend.onrender.com/api"; // change after deploy

function EPUBReader({ url, setPage }) {
  useEffect(() => {
    const book = ePub(url);
    const rendition = book.renderTo("viewer", { width: "100%", height: 600 });
    rendition.display();
    rendition.on("relocated", (loc) => {
      setPage(loc.start.displayed.page);
    });
  }, [url]);

  return <div id="viewer"></div>;
}

function PDFReader({ url, page, setPage }) {
  return (
    <div>
      <Document file={url}>
        <Page pageNumber={page} />
      </Document>
      <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}

function Reader({ user, story }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    axios.get(`${API}/getProgress.php`, {
      params: { username: user, story: story.name }
    }).then(res => setPage(res.data.page));
  }, [story]);

  useEffect(() => {
    const t = setTimeout(() => {
      axios.post(`${API}/progress.php`, {
        username: user,
        story: story.name,
        page
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [page]);

  const isPDF = story.url.endsWith(".pdf");

  return (
    <div>
      <h3>{story.name}</h3>
      {isPDF ? (
        <PDFReader url={story.url} page={page} setPage={setPage} />
      ) : (
        <EPUBReader url={story.url} setPage={setPage} />
      )}
    </div>
  );
}

function App() {
  const [user] = useState("admin");
  const [stories, setStories] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    axios.get(`${API}/stories.php`, {
      params: { username: user }
    }).then(res => setStories(res.data));
  }, []);

  const upload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", user);

    await axios.post(`${API}/upload.php`, formData);
    window.location.reload();
  };

  if (current) return <Reader user={user} story={current} />;

  return (
    <div>
      <input type="file" onChange={e => upload(e.target.files[0])} />
      {stories.map((s, i) => (
        <div key={i} onClick={() => setCurrent(s)}>
          {s.name}
        </div>
      ))}
    </div>
  );
}

export default App;
