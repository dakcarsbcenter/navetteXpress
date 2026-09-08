"use client";

// @phosphor-icons/react evalue un contexte partage (React.createContext) au
// chargement du module, incompatible avec l'evaluation cote Server Component
// (condition "react-server"). Ce wrapper "use client" isole cette evaluation
// dans le bundle client : HomeClient.tsx (Server Component) peut ainsi
// importer ces icones et les rendre comme de simples references client,
// sans jamais executer le module phosphor cote serveur.
export { ArrowRight, CheckCircle, Question, SteeringWheel } from "@phosphor-icons/react";
