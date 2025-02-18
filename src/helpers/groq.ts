"use server";

import { writeFile, unlink } from "fs/promises";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GroqTranslate = async (file: File) => {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join("/tmp", "audio.wav");
    await writeFile(filePath, buffer);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "pt",
      temperature: 0.0,
    });
    await unlink(filePath);
    return { data: transcription.text, error: null };
  } catch (error) {
    console.log("Error transcribing audio:", error);
    return { data: null, error: "Error processing audio" };
  }
};

export const callGroq = async (prompt: string, data?: object) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
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
          role: "user",
          content: prompt,
        },
        {
          role: "assistant",
          content:
            '{\n   "name": "Robalo Grelhado",\n   "price": 15,\n   "price2": 17,\n   "categoryId": 1,\n   "desc": "",\n   "tagId": null\n}',
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      response_format: {
        type: "json_object",
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
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
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

## Regras (não omitir nenhuma):

1. Título: Mensagem variada diariamente, curta, animada, para o ser enviada todos os dias de manhã a clientes, com emoji's, sem formatação especial.

2. Estrutura dos pratos, faça por ordem:
  - 💎 para special = true.
  - 🔹️ para category = "Peixe".
  - 🔸️ para category = "Carnes", everyday = false, special = false.
  - ▪️ para category = "Carnes", everyday = true.

3. Todos os pratos do array enviado devem ser listados, sem falta.

4. Limite de caracteres: A mensagem/resultado final não pode ultrapassar 160 caracteres.


5. Substituições, o texto deve ser sempre alterado mesmo que tenha outras palavras, analise 1 por 1 para não faltar nada:
    - "Hambúrguer" retirar o texto e alterar para o emoji "🍔".
    - Substituir texto, com, por "c/".
    - Substituir texto, churrasco, por "churr.".
    - Substituir texto, Maminha grelhada, por "Maminha".
    - Substituir texto, Tiras de barriga, por "Tiras".
    - Substituir texto, Bacalhau, por "Bac.".
    - Substituir texto, Posta de Alcatra grelhada, por "Posta de Alcatra".

6. Abreviações:
    - Faça algumas abreviações a pratos portugueses que façam sentido.
    - Pode utiliar a regra 5. como referência e aplique a mesma lógica para outros pratos similares.

7. Deixar vazio:
   - os grupos '🔺️' e '🍰' não deve alterar.

8. Ordem dos Grupos: 
    - 🔸️
    - ▪️
    - 🔹️
    - 💎

## Exemplo de Formato Esperado:
\`\`\`javascript
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
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `Array de pratos ${JSON.stringify(products)}`,
        },
      ],
      // model: "llama-3.1-8b-instant",
      model: "Llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null,
    });

    return {
      error: null,
      data: chatCompletion.choices[0].message.content,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.log({ errorMessage });
    return { error: errorMessage, data: null };
  }
};
