const Preloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => setLoading(false);

    window.addEventListener("load", handleLoad);

    if (document.readyState === "complete") {
      setLoading(false);
    }

    return () => window.removeEventListener("load", handleLoad);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex justify-center items-center z-[9999]">
      <div className="w-16 h-16 border-8 border-gray-300 dark:border-gray-800 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default Preloader;