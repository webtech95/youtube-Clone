import axios from "axios";
import { useEffect, useState, useRef } from "react";
import "./youTubeClone.css"; // Optional, can be removed if all Tailwind

const API_KEY = "AIzaSyD1LT2PSAIefg4CY6_Zq3oZFQaM_MY2QWg";
const CHANNEL_ID = "UCq-Fj5jknLsUf-MWSy4_brA";

const YoutubeClone = () => {
  const [videos, setVideos] = useState([]);
  const [selectvideo, setSelectvideo] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveComment, setLiveComment] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!selectvideo) return;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [selectvideo]);



  useEffect(() => {
    axios
      .get("https://www.googleapis.com/youtube/v3/channels", {
        params: { part: "snippet", id: CHANNEL_ID, key: API_KEY },
      })
      .then((res) => {
        if (res.data.items.length > 0) {
          setChannelInfo(res.data.items[0].snippet);
        }
      })
      .catch(console.error);
  }, []);

  const fetchVideos = (query = "") => {
    setLoading(true);
    axios
      .get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          channelId: CHANNEL_ID,
          maxResults: 30,
          q: query,
          type: "video",
          key: API_KEY,
        },
      })
      .then(async (res) => {
        const items = res.data.items;
        if (items.length === 0) {
          setVideos([]);
          setSelectvideo(null);
          setLoading(false);
          return;
        }

        const videoIds = items.map((item) => item.id.videoId).join(",");
        const statsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: { part: "statistics", id: videoIds, key: API_KEY },
        });

        const statsMap = {};
        statsRes.data.items.forEach((item) => {
          statsMap[item.id] = item.statistics;
        });

        const videosWithStats = items.map((item) => ({
          ...item,
          statistics: statsMap[item.id.videoId] || { viewCount: "0" },
        }));

        setVideos(videosWithStats.sort(() => Math.random() - 0.5));
        setSelectvideo(videosWithStats[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!selectvideo) return setLiveComment([]);

    const videoId = selectvideo.id.videoId;
    setCommentLoading(true);

    axios
      .get("https://www.googleapis.com/youtube/v3/commentThreads", {
        params: {
          part: "snippet",
          videoId: videoId,
          maxResults: 10,
          order: "relevance",
          textFormat: "plainText",
          key: API_KEY,
        },
      })
      .then((res) => {
        const comments = res.data.items.map((item) => {
          const topComment = item.snippet.topLevelComment.snippet;
          return {
            id: item.id,
            author: topComment.authorDisplayName,
            text: topComment.textDisplay,
          };
        });

        setLiveComment(comments);
        setCommentLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching comments", err);
        setLiveComment([]);
        setCommentLoading(false);
      });
  }, [selectvideo]);

  useEffect(() => {
    if (!selectvideo || !containerRef.current) return;

    containerRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [selectvideo]);

  return (

    <div ref={containerRef}
      className={`fixed inset-0 overflow-auto transition-colors duration-500 ${darkMode ? "bg-[#0f0f0f] text-white" : "bg-gray-100 text-black"}`}>
      <header className="flex justify-between items-center px-6 py-4 shadow-md bg-[#202020] dark:bg-[#181818]">
        <div className="text-2xl font-bold text-red-500">YouTube Clone</div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="px-4 py-2 rounded-lg outline-none bg-white text-black w-64"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVideos(searchQuery)}
          />
          <button
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="grid md:grid-cols-3 gap-6 p-6">
        <section className="md:col-span-2">
          {selectvideo ? (
            <>
              <div className="aspect-video w-full rounded overflow-hidden shadow-md">
                <iframe
                  src={`https://www.youtube.com/embed/${selectvideo.id.videoId}`}
                  title={selectvideo.snippet.title}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              </div>
              <h2 className="text-2xl font-semibold mt-4">{selectvideo.snippet.title}</h2>
              <div className="flex items-center justify-between mt-2">
                {channelInfo && (
                  <div className="flex items-center gap-3">
                    <img
                      src={channelInfo.thumbnails.default.url}
                      alt={channelInfo.title}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="font-medium text-lg">{channelInfo.title}</span>
                  </div>
                )}
                <span className="text-sm text-gray-400">
                  {parseInt(selectvideo.statistics.viewCount).toLocaleString()} views
                </span>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-bold mb-3">Live Comments</h3>
                <div className="space-y-3">
                  {commentLoading ? (
                    <p>Loading comments...</p>
                  ) : liveComment.length > 0 ? (
                    liveComment.map((comment) => (
                      <div key={comment.id} className="bg-gray-300 p-4 rounded-lg shadow-md">
                        <p className="font-semibold text-blue-800 text-left">{comment.author}</p>
                        <p className="text-black mt-1 text-left">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p>No live comments found.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>Loading video...</p>
          )}
        </section>

        <aside>
          <h3 className="text-xl font-semibold mb-4">Up Next</h3>
          <div className="space-y-4">
            {loading ? (
              <p>Loading videos...</p>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id.videoId}
                  className="flex gap-4 cursor-pointer p-2 hover:bg-gray-700 rounded-lg transition"
                  onClick={() => setSelectvideo(video)}
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-32 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-base leading-tight line-clamp-2">{video.snippet.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {parseInt(video.statistics.viewCount).toLocaleString()} views
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      <footer className="text-center py-6 text-gray-400 border-t border-gray-700">
        © 2025 WebTech YouTube Clone
      </footer>
    </div>
  );
};

export default YoutubeClone;