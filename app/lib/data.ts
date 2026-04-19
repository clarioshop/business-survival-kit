// lib/data.ts - All your guide content goes here

export interface Question {
  id: number;
  text: string;
  modelAnswer: string;
  examTip: string;
}

export interface Section {
  id: number;
  title: string;
  content: any[];
  questions: Question[];
}

export const sections: Section[] = [
  // SECTION 1
  {
    id: 1,
    title: "1. The Need for Business Finance",
    content: [
      { type: "heading", level: 2, text: "What is Business Finance?" },
      { type: "text", text: "Business finance is the money required to start, run, and grow a business. Every business needs money to pay for things before customers pay them." },
      { type: "heading", level: 3, text: "A Simple Example" },
      { type: "text", text: "Imagine starting a lemonade stand. You need lemons, sugar, cups, a table, and a sign. That costs $20. You haven't sold any lemonade yet. Where does that $20 come from? That's business finance." },
      { type: "heading", level: 3, text: "Why Businesses Need Money" },
      { type: "table", headers: ["Reason", "Example"], rows: [
        ["To start", "Buying your first coffee machine for a café"],
        ["To grow", "Opening a second location"],
        ["To survive", "Fixing a broken oven so you can keep cooking"]
      ]},
      { type: "heading", level: 3, text: "Cash vs. Profit" },
      { type: "text", text: "Cash is the actual money in the bank. Profit is what's left after subtracting costs from sales. They are not the same thing." },
      { type: "text", text: "Example: You sell a $100 toy to a customer who pays in 60 days. You made $40 profit on paper, but you have $0 cash right now. You actually spent $60 to make the toy, so you're worse off until the customer pays." },
      { type: "heading", level: 3, text: "Working Capital" },
      { type: "text", text: "Working capital = Current Assets − Current Liabilities. It's the money available for daily operations." },
      { type: "text", text: "Example: A bakery needs working capital to buy flour today so it can sell bread tomorrow. If the bakery spends all its money on a new oven and has nothing left for flour, it can't make bread and will close." },
      { type: "heading", level: 3, text: "Two Types of Spending" },
      { type: "table", headers: ["Type", "What it means", "Example"], rows: [
        ["Capital Expenditure", "Money spent on things that last more than one year", "Buying a delivery truck"],
        ["Revenue Expenditure", "Money spent on day-to-day costs", "Petrol for the truck"]
      ]},
      { type: "heading", level: 3, text: "When a Business Fails" },
      { type: "text", text: "Administration: An outsider tries to save the struggling business." },
      { type: "text", text: "Bankruptcy: The business legally cannot pay its debts." },
      { type: "text", text: "Liquidation: The business sells everything it owns to pay debts, then closes forever." }
    ],
    questions: [
      { id: 1, text: "A restaurant has $50,000 profit this year but can't pay its $10,000 electricity bill. How is this possible?", modelAnswer: "Profit doesn't equal cash. The profit might be tied up in customers who haven't paid yet, inventory that hasn't sold, or the owner took the profit out.", examTip: "Cash flow questions appear on 70% of papers. Profit is theory, cash is reality." },
      { id: 2, text: "A toy company buys a new factory for $1 million and spends $200,000 on plastic for toys. Which one affects working capital immediately and why?", modelAnswer: "The $200,000 on plastic affects working capital immediately because it's a daily operational cost. The factory is a long-term asset.", examTip: "Capital = long-term assets. Revenue = daily costs. Examiners love this distinction." }
    ]
  }
];