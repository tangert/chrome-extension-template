// this is the file where im drafting the basics of the protocol
interface URL {
    value: string;
    visits: Array<Date>;
  }
  
  interface Tab {
    id: string;
    url: URL;
    timeCreated: Date;
  }
  
  // A generic tab group that can be rendered / represented by the client.
  interface TabGroup {
    id: string;
    timeCreated: Date;
    tabs: Array<Tab>;
    children: Array<TabGroup>;
  }
  
  // You can add or remove any combination of tabs or windows as a single operation to a session
  interface Session {
    id: string;
    timeCreated: Date;
    version: number;
    tabGroups: Array<TabGroup>;
  }
  

  type OpCode = 'add' | 'remove' | 'duplicate' | 'merge' | 'delete'
  
  // a single tab is represented as an array of Window 1 with 1 tab.
  // so [[url]]
  interface SessionOp {
    //   add a set of tabs (represented as a window array) from a session
    add: (tabGroups: Array<TabGroup>, session: Session) => Session;
    //   remove a set of tabs (represented as a window array) from a session
    remove: (tabGroups: Array<TabGroup>, session: Session) => Session;
    //   duplicate a session
    duplicate: (session: Session) => Session;
    //   merge 2 sessions together
    merge: (session1: Session, session2: Session) => Session;
    //   delete a session
    delete: (session: Session) => {};
  }
  
  // do you need something like this?
  //   apply: (op: SessionOp) => {};
  