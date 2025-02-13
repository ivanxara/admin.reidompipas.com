type Grouped<T> = {
  [key: string]: T[];
};

export const arr = {
  groupBy: <T>(array: T[], key: string): Grouped<T> => {
    return array.reduce((acc: Grouped<T>, obj: T) => {
      const keyParts = key.split(".");

      const keyValue = keyParts.reduce((value: any, part: string) => {
        return value ? value[part as keyof typeof value] : undefined;
      }, obj);

      // Ensure keyValue is a valid key for grouping
      if (keyValue !== undefined && keyValue !== null) {
        const keyString = String(keyValue); // Ensure keyValue is a string for object keys

        if (!acc[keyString]) {
          acc[keyString] = [];
        }
        acc[keyString].push(obj);
      }

      return acc;
    }, {} as Grouped<T>);
  },
};

export const dates = {
  getDateExtensive: (date: any) => {
    const diasDaSemana = [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ];

    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];

    const diaSemana = diasDaSemana[date.getDay()]; // Obtém o dia da semana
    const dia = date.getDate(); // Obtém o dia do mês
    const mes = meses[date.getMonth()]; // Obtém o nome do mês

    return `${diaSemana}, ${dia} ${mes}`;
  },
};
