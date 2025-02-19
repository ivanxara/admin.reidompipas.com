'use server';

import { writeFile, unlink } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY2 });

export const GroqTranslate = async (file: File) => {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join('/tmp', 'audio.wav');
    await writeFile(filePath, buffer);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'pt',
      temperature: 0.0,
    });
    await unlink(filePath);
    return { data: transcription.text, error: null };
  } catch (error) {
    console.log('Error transcribing audio:', error);
    return { data: null, error: 'Error processing audio' };
  }
};

export const callGroq = async (prompt: string, data?: object) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Você receberá um texto contendo informações para a criação de um prato de comida português para um restaurante. Sua tarefa é transformar esse texto em um JSON seguindo o formato do 'JSON Exemplo', O campo "product" representará o prato principal com seus detalhes, enquanto o campo "similar" conterá uma lista de produtos que possuem nomes parecidos com o do prato principal, você pode encontrar o dados existentes nos dados da base de dados dentro do objecto 'projects'.


          JSON Exemplo:
          {
            "product": {
              "name": z.string(),
              "price": z.coerce.number(),
              "price2": z.coerce.number().optional(),
              "desc": z.string().optional(),
              "categoryId": z.coerce.number(), // foreign key (table categories)
              "tagId": z.coerce.number().nullable() // foreign key (table tags)
            },
            "similar": z.array(
              z.object({
                "id": z.number(),
                "name": z.string()
              })
            )
          }


          Regras do 'product':
          
          1 - O campo 'name', é obrigatorio, vai ser sempre fornecido e é o nome do prato, se o nome estiver estranho ou mal escrito verifique nomes de pratos portugueses e utilize o nome correto, o nome do restaurante é "Rei Dom Pipas" e alguns pratos podem conter o texto "Dom" ou "Rei", ter atenção porque esses textos podem estar mal escritos na prompt enviada.

          2 - O campo 'price', não é obrigatorio, será o preço do prato para 1 pessoa, por defeito se tiver a texto indicado só tiver 1 valor deve utilizar esse valor.

          3 - O campo 'price2', não é obrigatorio, será o preço do prato para 2 pessoas, caso a prompt enviada tiver 2 valores diferentes utilize o mais caro para 2 pessoas.

          4 - O campo tagId, não é obrigatorio, para conseguir prencher este campo consulte a Base de dados no objeto 'tags' e procure por algo relevante e retorne o ID correspondente, se na prompt não tiver nada a indicar não preencha.

          5 - O campo categoryId, é obrigatorio, para conseguir o valor deste campo, terá de descobrir conforme o nome do prato 'name'.

          6 - O campo 'desc', não é obrigatorio, será a descrição do prato só pode ser atribuída quando na prompt mencionar diretamente a descrição.

          Base de dados, para consultar os Ids das foreign keys: 
          ${JSON.stringify(data)}
          `,
        },
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content:
            '{\n   "name": "Robalo Grelhado",\n   "price": 15,\n   "price2": 17,\n   "categoryId": 1,\n   "desc": "",\n   "tagId": null\n}',
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: {
        type: 'json_object',
      },
      stop: null,
    });

    let result = chatCompletion?.choices[0]?.message?.content;
    if (result) result = JSON.parse(result);

    return {
      error: null,
      data: result,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.log({ errorMessage });
    return { error: errorMessage, data: null };
  }
};

export const callGroq2 = async (products: any) => {
  try {
    const prompt = `
Gera uma mensagem diária para SMS com máximo de 160 caracteres para um restaurante em português de Portugal, animada e convidativa, pronta para envio de manhã.

## Entrada:
Um array de objetos representando pratos de comida portuguesa. Exemplo:
\`\`\`json
[
  {
    "id": 289,
    "name": "Salteado de esparguete c/frango",
    "category": "Carnes",
    "everyday": false,
    "special": false
  }
]
\`\`\`

Regras a cumprir:

1. Título: Mensagem variada diariamente, curta, animada, para o ser enviada todos os dias de manhã a clientes, com emoji's, sem formatação especial.

2. Estrutura dos pratos, faça por ordem:
  - 💎 para special = true.
  - 🔹️ para category = "Peixe".
  - 🔸️ para category = "Carnes", everyday = false, special = false.
  - ▪️ para category = "Carnes", everyday = true.
  - 🔺️ ( deixar vazio )
  - 🍰 ( deixar vazio )

3. Todos os pratos do array enviado devem ser listados, sem falta.

4. Limite de caracteres: A mensagem/resultado final não pode ultrapassar 160 caracteres.

5. Substituições: o texto deve ser sempre modificado, independentemente de conter outras palavras. Analise cada item individualmente para garantir que nada seja omitido:
    - Alterar o texto "Hambúrguer, por o emoji "🍔".
    - Alterar o texto "com, por "c/".
    - Alterar o texto "churrasco, por "churr.".
    - Alterar o texto "Maminha grelhada, por "Maminha".
    - Alterar o texto "Tiras de barriga, por "Tiras".
    - Alterar o texto "Bacalhau, por "Bac.".
    - Alterar o texto "Posta de Alcatra grelhada, por "Posta de Alcatra".

6. Abreviações:
    - Faça algumas abreviações a pratos portugueses que façam sentido.
    - Pode utiliar a regra 5. como referência e aplique a mesma lógica para outros pratos similares.

7. Não alterar:
    - os grupos '🔺️' e '🍰' não deve ser alterador de qualquer forma.
    - mantenha exatamente igual ao exemplo, "Exemplo de Formato Esperado"

8. Ordem dos Grupos: 
    - 🔸️
    - ▪️
    - 🔹️
    - 💎
    - 🔺️
    - 🍰

O Resultado final deve ser identico ao "Exemplo de Formato Esperado":
\`\`\`
[titulo]

🔸️Prato X
🔸️Prato X
🔸️Prato X
...

▪️Prato X
▪️Prato X
...

🔹️Prato X
🔹️Prato X
...

💎Prato X
💎Prato X
...

🔺️
🔺️

🍰
\`\`\`

Retorna apenas a mensagem formatada conforme as regras, sem explicações adicionais.
`;
    console.log(prompt);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: `Array de pratos ${JSON.stringify(products)}`,
        },
      ],
      // model: "llama-3.1-8b-instant",
      model: 'Llama3-70b-8192',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null,
    });
    console.log(chatCompletion?.choices);

    return {
      error: null,
      data: chatCompletion?.choices?.[0].message.content,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.log({ errorMessage });
    return { error: errorMessage, data: null };
  }
};

export const callGroq3 = async (userPrompt: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `

          Contexto: Restaurante Português Portugal
          
          1 - Pequeno titulo diário variado e animado para enviar o menu diario aos clientes, utilize sempre um emoji feliz.
            1.1 - Utilize estes exemplos e crie um titulo novo:
              1.1.1 - 😊 Bom dia!
              1.1.2 - Bom dia! 🌞
              1.1.3 - Menu do Dia 🤩
              1.1.4 - BOM DIA E C/ BOAS ENERGIAS😀✨️

          2 - Voce irá receber um array de pratos de comida portugueses, preciso que você abrevie o nome de todos os pratos possiveis, procurando a melhor solução para reduzir o nome do prato e retornar um array JSON do mesmo formato.
            2.1 - Altere apenas a chave "name" nunca altere as outras chaves do objecto.
            2.2 - Utilize estes exemplos e faça novas abreviações com outras palavras, se utilizar algum dos exemplos abaixo altere só a palavra entre "" mas mantenha o resto do nome igual, ou tente reduzir essas palavras:
              2.2.1 - Alterar o texto "Posta de Alcatra grelhada" por "Posta de Alcatra".
              2.2.2 - Alterar o texto "Hambúrguer", por o emoji "🍔".
              2.2.3 - Alterar o texto "com" por "c/".
              2.2.4 - Alterar o texto "churrasco" por "churr.".
              2.2.5 - Alterar o texto "Maminha grelhada" por "Maminha".
              2.2.6 - Alterar o texto "Tiras de barriga" por "Tiras".
              2.2.7 - Alterar o texto "Bacalhau" por "Bac."....
              2.2.7 - Alterar o texto "queijo e fiambre" por "queijo/fiambre".
              2.2.7 - Alterar o texto "Costeletas" por "Cost." ( mantanha o resto do texto )
            2.3 - Não repita nomes.
          
          o resultado final deve ser um JSON com este formato: 
          {
            label: "", 
            items: []
          } 

          PS: Todos os nomes/titulos devem estar em Português de Portugal.
          `,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      // model: 'llama-3.3-70b-versatile',
      model: 'llama-3.1-8b-instant',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: {
        type: 'json_object',
      },
      stop: null,
    });

    let result = chatCompletion?.choices[0]?.message?.content;
    if (result) result = JSON.parse(result);

    return {
      error: null,
      data: result,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.log({ errorMessage });
    return { error: errorMessage, data: null };
  }
};
