import React from "react";
import { useEffect, useRef } from "react";
import startGame from "./game/gameLoop";

export default function GameCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    startGame(canvasRef.current);
  }, []);

  return <canvas ref={canvasRef} width={1024} height={430} />;
}
