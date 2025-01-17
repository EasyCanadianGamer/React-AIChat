import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Input from "./Input";
import ReactMarkdown from "react-markdown";
import { debounce } from "lodash";

function Chat() {
  const [ ,setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState<{ role: string; text: string }[]>([]);
  const [searchCache, setSearchCache] = useState<Record<string, any>>({});
  const [isSearchEnabled, setIsSearchEnabled] = useState<boolean>(false);

  const fetchData = async (userPrompt: string) => {
    // console.log("fetchData called with prompt:", userPrompt); // Debug log
    setLoading(true);
    try {

          // Fetch the user's location
    const location = await fetchLocation();


    const locationPrompt = `My current location is latitude ${location.latitude}, longitude ${location.longitude}.`;
    const city = await reverseGeocode(location.latitude, location.longitude);
    const AccuratelocationPrompt = `My current location is latitude ${city}.`
    
console.log ( locationPrompt);
console.log ( AccuratelocationPrompt);

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        },
        systemInstruction: "You are named J.A.R.V.I.S. - Just A Rather Very Intelligent System who assists me on any task I ask you to, you call me Sir.  Always provide a concise answer of your response in two to three sentences.",
      });
  
      let finalPrompt = userPrompt;
  
      if (isSearchEnabled) {
        const searchResults = await fetchSearchResults(finalPrompt,city);
        finalPrompt = `
          User Prompt: ${userPrompt}
          Search Results: ${JSON.stringify(searchResults)}
        `;
      }
  
      // Add user prompt to conversation history
      setConversation((prev) => [...prev, { role: "user", text: userPrompt },
        
      ]);
  
      // Prepare messages for the API call
      const messages = conversation.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
      messages.push({ role: "user", parts: [{ text: finalPrompt }] });
  
      // Generate content using the updated conversation history
      const result = await model.generateContent({ contents: messages });
      const responseText = result.response.text();

 
      // Add AI response to conversation history
      setConversation((prev) => [...prev, 
        { role: "assistant", text: responseText },]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const debouncedFetchData = debounce(async (userPrompt: string) => {
    // console.log("debouncedFetchData called with prompt:", userPrompt); // Debug log
    await fetchData(userPrompt);
  }, 500);


  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    const apiKey = "AIzaSyBqmd5bqzQyeSOxmWhZDtGf03i-SBJvhnU"; // Replace with your API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.status === "OK") {
        // Extract the city, state, and country from the address components
        const addressComponents = data.results[0].address_components;
        let city = "";
        let state = "";
        let country = "";
  
        for (const component of addressComponents) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          } else if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (component.types.includes("country")) {
            country = component.long_name;
          }
        }
  
        // Format the address (e.g., "Bordentown, NJ, USA")
        const formattedAddress = `${city}, ${state}, ${country}`;
        return formattedAddress;
      } else {
        throw new Error("Unable to reverse geocode the location.");
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      throw error;
    }
  };
  const fetchLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error("User denied the request for Geolocation."));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error("Location information is unavailable."));
                break;
              case error.TIMEOUT:
                reject(new Error("The request to get user location timed out."));
                break;
              default:
                reject(new Error("An unknown error occurred."));
                break;
            }
          },
          { timeout: 10000 } // Set a timeout (e.g., 10 seconds)
        );
      }
    });
  };


  const fetchSearchResults = async (query: string, city?: string) => {
    if (searchCache[query]) return searchCache[query]; // Return cached results
    const locationQuery = city;

    const proxyUrl = `${import.meta.env.VITE_BACKEND}/api/search?q=${encodeURIComponent(query)}${locationQuery}`;

    try {
      const response = await fetch(proxyUrl);
      const text = await response.text();
      // console.log("Raw response from proxy server:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = JSON.parse(text);

      const summary = data.organic_results
        .slice(0, 3) // Limit to top 3 results
        .map((result: any) => `${result.title}: ${result.snippet}`)
        .join("\n");

      // Cache the results
      setSearchCache((prev) => ({ ...prev, [query]: summary }));

      return summary;
    } catch (error) {
      console.error("Error fetching search results:", error);
      return null;
    }
  };

  const handleSubmit = (newPrompt: string) => {
    // console.log("handleSubmit called with prompt:", newPrompt); // Debug log
    debouncedFetchData(newPrompt);
    
  };

  const toggleSearch = () => {
    setIsSearchEnabled((prev) => !prev); // Toggle search functionality
  };
  const clearConversation = () => {
    setConversation([]);
    setResult("");
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="w-full max-w-2xl">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`my-2 p-4 rounded-lg text-black ${
              msg.role === "user" ? "bg-blue-100  self-end" : "bg-gray-100   self-start"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "J.A.R.V.I.S."}:</strong>
            <ReactMarkdown className="mt-2">{msg.text}</ReactMarkdown>
          </div>
        ))}
      </div>

      <Input onSubmit={handleSubmit} disabled={loading} />

      <button
        onClick={toggleSearch}
        className={`mt-4 px-4 py-2 rounded-md transition-colors ${
          isSearchEnabled
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
        }`}
      >
        {isSearchEnabled ? "Disable Search" : "Enable Search"}
      </button>
      <button
  onClick={clearConversation}
  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
>
  Clear Conversation
</button>
    </div>
  );
}

export default Chat;