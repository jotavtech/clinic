import { customAlphabet } from 'nanoid';

interface CodeGeneratorOptions {
  clientName?: string;
  usePrefix?: boolean;
  length?: number;
}

export class ReferralCodeGenerator {
  private static readonly DEFAULT_LENGTH = 6;
  private static readonly ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removidos caracteres ambíguos
  
  /**
   * Gera um código de indicação personalizado
   * @param options Opções de geração do código
   * @returns Código de indicação único
   */
  static generate(options: CodeGeneratorOptions = {}): string {
    const {
      clientName,
      usePrefix = true,
      length = this.DEFAULT_LENGTH
    } = options;

    // Cria um gerador de ID usando nanoid com os caracteres permitidos
    const generateId = customAlphabet(this.ALLOWED_CHARS, length);

    let code = '';

    if (usePrefix && clientName) {
      // Pega as iniciais do nome do cliente (até 2 caracteres)
      const initials = clientName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      // Gera o código com as iniciais + hífen + números aleatórios
      code = `${initials}-${generateId(length - 3)}`;
    } else {
      // Gera um código totalmente aleatório
      code = generateId(length);
    }

    return code;
  }

  /**
   * Valida se um código de indicação está no formato correto
   * @param code Código a ser validado
   * @returns true se o código é válido
   */
  static isValid(code: string): boolean {
    // Verifica o formato básico do código
    const basicFormat = /^[A-Z0-9-]{6,10}$/;
    
    // Verifica o formato com prefixo
    const prefixFormat = /^[A-Z]{2}-[A-Z0-9]{4,7}$/;

    return basicFormat.test(code) || prefixFormat.test(code);
  }

  /**
   * Extrai informações de um código de indicação
   * @param code Código a ser analisado
   * @returns Objeto com informações do código
   */
  static parseCode(code: string): { prefix?: string; suffix: string } {
    const parts = code.split('-');
    
    if (parts.length === 2) {
      return {
        prefix: parts[0],
        suffix: parts[1]
      };
    }

    return {
      suffix: code
    };
  }
} 