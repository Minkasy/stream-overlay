function getWebSocketURL() {

    const protocol =
      window.location.protocol === "https:"
        ? "wss:"
        : "ws:";
  
    return `${protocol}//${window.location.host}`;
  }
  
  function createWebSocket(onMessage) {
  
    let ws;
  
    function connect() {
  
      ws = new WebSocket(getWebSocketURL());
  
      ws.onopen = () => {
        console.log("WebSocket connected");
      };
  
      ws.onmessage = onMessage;
  
      ws.onclose = () => {
  
        console.log(
          "WebSocket disconnected"
        );
  
        setTimeout(connect, 1000);
      };
    }
  
    connect();
  
    return {
      send(data) {
  
        if (
          ws &&
          ws.readyState === WebSocket.OPEN
        ) {
  
          ws.send(JSON.stringify(data));
        }
      }
    };
  }