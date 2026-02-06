/**
 * ERROR BOUNDARY - SPRINT 17
 * Captura errores de React y guarda logs estructurados
 * Evita que un error derrumbe toda la app
 */

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "../../utils/logger";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Generar ID único para este error (para rastreo)
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setState({ errorId });

    // Log estructurado del error
    logger.error("ErrorBoundary", "Error capturado en React", error, {
      errorId,
      componentStack: errorInfo.componentStack,
      message: error.message,
      type: error.name,
    });

    // En el futuro: enviar a servicio de error tracking (Sentry, etc)
  }

  handleReset = () => {
    logger.info("ErrorBoundary", "Reiniciando aplicación después de error");
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
    // Reload page
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border-2 border-red-200">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle size={40} className="text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-red-600 text-center mb-2">
              Algo salió mal
            </h1>

            {/* Error ID */}
            <p className="text-xs text-gray-500 text-center font-mono mb-4 bg-gray-50 p-2 rounded">
              Error ID: {this.state.errorId}
            </p>

            {/* Message */}
            <p className="text-gray-700 text-center mb-4">
              Ha ocurrido un error inesperado en la aplicación. Nuestro equipo
              ha sido notificado.
            </p>

            {/* Details (Dev only) */}
            {import.meta.env.MODE === "development" && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-mono">
                  Detalles técnicos (Dev)
                </summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 text-red-600">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}

            {/* Reset Button */}
            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>

            {/* Support Message */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Si el problema persiste, contacta a soporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
