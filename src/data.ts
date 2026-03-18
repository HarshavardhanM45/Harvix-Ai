export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Question {
  id: number;
  question: string;
  category: string;
}

export const INTERVIEW_CATEGORIES: Category[] = [
  {
    id: 'technical',
    title: 'Technical Interview',
    description: 'Core fundamentals: OS, Computer Networks, DBMS, and OOPS.',
    icon: '/assets/icons/tech.png'
  },
  {
    id: 'hr',
    title: 'HR Interview',
    description: 'Behavioral, Situational, and Culture-fit questions.',
    icon: '/assets/icons/hr.png'
  },
  {
    id: 'ds',
    title: 'Data Science',
    description: 'Statistics, Probability, Machine Learning, and Data Handling.',
    icon: '/assets/icons/ds.png'
  },
  {
    id: 'aiml',
    title: 'AI & Machine Learning',
    description: 'Deep Learning, Neural Networks, Computer Vision, and NLP.',
    icon: '/assets/icons/aiml.png'
  },
  {
    id: 'fullstack',
    title: 'Full Stack Development',
    description: 'Frontend, Backend, APIs, and Web Architectures.',
    icon: '/assets/icons/webdev.png'
  },
  {
    id: 'cloud',
    title: 'Cloud Computing',
    description: 'AWS, Azure, Docker, Kubernetes, and Serverless.',
    icon: '/assets/icons/cloud.png'
  }
];export interface PrepTopic {
  id: string;
  title: string;
  videoLink: string;
  category: 'core' | 'programming';
  subtasks: string[];
  homework: string[];
  introduction: string;
  quizzes?: MCQ[];
}

export const PROGRAMMING_TOPICS: PrepTopic[] = [
  { 
    id: 'java-intro', 
    title: 'Intro to Java', 
    videoLink: 'https://youtu.be/TAtrPoaJ7gc?si=2pZ0ZYtdTvMvSxiu', 
    category: 'programming',
    subtasks: ['JDK vs JRE vs JVM', 'Your first Java Program', 'Primitive Data Types', 'Naming Conventions'],
    homework: ['412 — Fizz Buzz', '9 — Palindrome Number', '7 — Reverse Integer', '258 — Add Digits', '231 — Power of Two'],
    introduction: 'Java is a widely used object-oriented programming language commonly used in enterprise applications and software development. In this section, you will learn the basic structure of a Java program, including classes, the main method, and program execution. You will also understand variables, data types, and basic syntax. These fundamentals help you start writing programs and solving coding problems. A strong understanding of Java basics is essential before learning data structures and algorithms.'
  },
  { 
    id: 'loops', 
    title: 'Looping', 
    videoLink: 'https://youtu.be/ldYLYRNaucM?si=J4A5NRMTDrl2Lr58', 
    category: 'programming',
    subtasks: ['While Loops', 'For Loops', 'Do-While Loops', 'Nested Loops'],
    homework: ['70 — Climbing Stairs', '202 — Happy Number', '66 — Plus One', '1523 — Count Odd Numbers in an Interval Range', '1342 — Number of Steps to Reduce a Number to Zero'],
    introduction: 'Loops are used to repeat a set of instructions multiple times in a program. They are useful when working with arrays, performing calculations, or processing large amounts of data. In this topic, you will learn about different types of loops such as for, while, and do-while. You will also understand when to use each type of loop effectively. Looping concepts are essential for solving many coding interview problems.'
  },
  { 
    id: 'switch', 
    title: 'Switch Statements', 
    videoLink: 'https://youtu.be/mA23x39DjbI?si=gKmg2FI6MHMMkTyE', 
    category: 'programming',
    subtasks: ['Syntax', 'Default Case', 'Break Statement', 'Nested Switch'],
    homework: ['1185 — Day of the Week', '1812 — Determine Color of a Chessboard Square', '1232 — Check If It Is a Straight Line', '2525 — Categorize Box According to Criteria', '997 — Find the Town Judge'],
    introduction: 'Switch statements provide an efficient way to perform multiple conditional checks in a program. Instead of writing many if-else statements, switch allows you to handle different cases more clearly. It improves code readability and simplifies decision-making logic. In this topic, you will learn how switch statements work and how to use them with different values. Understanding conditional logic is important for building efficient programs.'
  },
  { 
    id: 'methods', 
    title: 'Methods', 
    videoLink: 'https://youtu.be/vvanI8NRlSI?si=a5fLNH8VsQ4wnCzr', 
    category: 'programming',
    subtasks: ['Method Definition', 'Parameter Passing', 'Return Types', 'Scope'],
    homework: ['367 — Valid Perfect Square', '326 — Power of Three', '633 — Sum of Square Numbers', '69 — Sqrt(x)', '171 — Excel Sheet Column Number'],
    introduction: 'Methods are reusable blocks of code that perform a specific task in a program. They help organize large programs into smaller, manageable pieces. By using methods, you can avoid repeating code and improve program readability. This section covers method declaration, parameters, return types, and method calls. Mastering methods is essential for writing structured and maintainable programs.'
  },
  { 
    id: 'arrays', 
    title: 'Arrays', 
    videoLink: 'https://youtu.be/n60Dn0UsbEk?si=d3zRuN0vdp0UM7Go', 
    category: 'programming',
    subtasks: ['Array Declaration', 'Memory Management', 'Multidimensional Arrays', 'Passing to Methods'],
    homework: ['1 — Two Sum', '121 — Best Time to Buy and Sell Stock', '217 — Contains Duplicate', '53 — Maximum Subarray', '283 — Move Zeroes', '189 — Rotate Array'],
    introduction: 'Arrays are data structures used to store multiple elements of the same type in a single variable. They allow efficient storage and access of data using indexes. Arrays are widely used in programming and form the foundation for many other data structures. In coding interviews, a large number of problems are based on array manipulation. Understanding arrays well is crucial for solving algorithmic problems.'
  },
  { 
    id: 'strings', 
    title: 'Strings', 
    videoLink: 'https://youtu.be/zL1DPZ0Ovlo?si=uLOC5fvXklGA9K2Y', 
    category: 'programming',
    subtasks: ['String Immutability', 'String Pool', '.equals() vs ==', 'StringBuilder Performance'],
    homework: ['125 — Valid Palindrome', '14 — Longest Common Prefix', '242 — Valid Anagram', '344 — Reverse String', '49 — Group Anagrams'],
    introduction: 'Strings represent sequences of characters and are used to handle textual data. Many programming tasks involve processing and analyzing strings. In this section, you will learn string operations such as concatenation, comparison, and manipulation. You will also understand how StringBuilder improves performance when modifying strings. String problems are very common in coding interviews.'
  },
  { 
    id: 'linear-search', 
    title: 'Linear Search', 
    videoLink: 'https://youtu.be/_HRA37X8N_Q?si=3VubVLCd11ks1yij', 
    category: 'programming',
    subtasks: ['Basic Algorithm', 'Time Complexity', 'Search in Strings', 'Search in 2D Arrays'],
    homework: ['1295 — Find Numbers with Even Number of Digits', '1346 — Check If N and Its Double Exist', '1672 — Richest Customer Wealth', '2089 — Find Target Indices After Sorting Array', '1827 — Minimum Operations to Make the Array Increasing'],
    introduction: 'Linear search is the simplest method for finding an element in a list or array. It works by checking each element one by one until the target value is found. Although it is easy to implement, it may not be efficient for large datasets. Understanding linear search helps beginners learn how searching algorithms work. It also builds the foundation for learning more advanced searching techniques.'
  },
  { 
    id: 'binary-search', 
    title: 'Binary Search', 
    videoLink: 'https://youtu.be/f6UU7V3szVw?si=5oZpNDZV0xY4nhU7', 
    category: 'programming',
    subtasks: ['Order-Agnostic BS', 'Middle Calculation Logic', 'Application in Sorted Arrays', 'Flowcharts'],
    homework: ['704 — Binary Search', '35 — Search Insert Position', '162 — Find Peak Element', '33 — Search in Rotated Sorted Array', '278 — First Bad Version'],
    introduction: 'Binary search is an efficient algorithm used to find elements in a sorted array. Instead of checking each element, it repeatedly divides the search space into halves. This significantly reduces the number of comparisons needed. Binary search has a time complexity of O(log n), making it very fast for large datasets. It is one of the most frequently asked algorithms in coding interviews.'
  },
  { 
    id: 'bubble-sort', 
    title: 'Bubble Sort', 
    videoLink: 'https://youtu.be/F5MZyqRp_IM?si=LyI1Q_-umRekNCKG', 
    category: 'programming',
    subtasks: ['Mechanics', 'Best/Worst Case', 'Optimization', 'Space Complexity'],
    homework: ['905 — Sort Array By Parity', '75 — Sort Colors', '1051 — Height Checker', '1122 — Relative Sort Array', '1636 — Sort Array by Increasing Frequency'],
    introduction: 'Bubble sort is a simple sorting algorithm that repeatedly compares adjacent elements and swaps them if they are in the wrong order. With each iteration, the largest element moves to the correct position. Although it is not efficient for large datasets, it helps beginners understand the concept of sorting. Bubble sort is useful for learning how algorithms manipulate arrays. Understanding basic sorting techniques builds the foundation for more advanced algorithms.'
  },
  { 
    id: 'selection-sort', 
    title: 'Selection Sort', 
    videoLink: 'https://youtu.be/Nd4SCCIHFWk?si=Ox3d6KLI-tlYB4Go', 
    category: 'programming',
    subtasks: ['Finding Minimums', 'Swapping Logic', 'Stability', 'Applications'],
    homework: ['1200 — Minimum Absolute Difference', '561 — Array Partition', '976 — Largest Perimeter Triangle', '1984 — Minimum Difference Between Highest and Lowest of K Scores', '414 — Third Maximum Number'],
    introduction: 'Selection sort works by repeatedly selecting the smallest element from the unsorted portion of the array. This element is then placed in its correct position in the sorted portion. The process continues until the entire array is sorted. Although the algorithm is simple, it is not very efficient for large datasets. Learning selection sort helps understand how sorting algorithms work internally.'
  },
  { 
    id: 'insertion-sort', 
    title: 'Insertion Sort', 
    videoLink: 'https://youtu.be/By_5-RRqVeE?si=avBpX96Lg8I9hxRm', 
    category: 'programming',
    subtasks: ['Step-by-step Dry Run', 'Why Use Insertion Sort?', 'Stability', 'Adaptive Nature'],
    homework: ['147 — Insertion Sort List', '912 — Sort an Array', '148 — Sort List', '179 — Largest Number', '324 — Wiggle Sort II'],
    introduction: 'Insertion sort builds a sorted array one element at a time. It takes each element and inserts it into its correct position within the sorted portion of the array. This algorithm is efficient for small datasets and nearly sorted arrays. It is commonly used as part of more complex sorting algorithms. Understanding insertion sort helps develop intuition about data ordering.'
  },
  { 
    id: 'cycle-sort', 
    title: 'Cycle Sort', 
    videoLink: 'https://youtu.be/JfinxytTYFQ?si=a9nS-zswPHS8_Ea8', 
    category: 'programming',
    subtasks: ['Pattern Recognition (1 to N)', 'Index Logic', 'Minimum Swaps', 'Missing Number Questions'],
    homework: ['448 — Find All Numbers Disappeared in an Array', '287 — Find the Duplicate Number', '645 — Set Mismatch', '268 — Missing Number', '442 — Find All Duplicates in an Array'],
    introduction: 'Cycle sort is an in-place sorting algorithm designed to minimize the number of writes to the array. It works by placing elements directly into their correct positions. This makes it useful in situations where writing to memory is costly. Cycle sort is conceptually different from other sorting algorithms. Learning this algorithm helps deepen understanding of array manipulation.'
  },
  { 
    id: 'merge-sort', 
    title: 'Merge Sort', 
    videoLink: 'https://youtu.be/iKGAgWdgoRk?si=qh5hiS2sL1arsx9e', 
    category: 'programming',
    subtasks: ['Divide and Conquer', 'Merging Arrays', 'Recursion Depth', 'Auxiliary Space'],
    homework: ['148 — Sort List', '88 — Merge Sorted Array', '315 — Count of Smaller Numbers After Self', '493 — Reverse Pairs', '912 — Sort an Array'],
    introduction: 'Merge sort is a powerful sorting algorithm based on the divide-and-conquer approach. It divides the array into smaller parts, sorts them, and then merges them back together. This algorithm guarantees a time complexity of O(n log n). It is very efficient and commonly used in real-world applications. Understanding merge sort also helps in learning recursion and algorithm design.'
  },
  { 
    id: 'quick-sort', 
    title: 'Quick Sort', 
    videoLink: 'https://youtu.be/Z8svOqamag8?si=4_LxEYWqAim2PVa5', 
    category: 'programming',
    subtasks: ['Pivot Archetypes', 'Lomuto/Hoare Partition', 'Worst Case Scenarios', 'Hybrid Sorting'],
    homework: ['912 — Sort an Array', '215 — Kth Largest Element in an Array', '347 — Top K Frequent Elements', '973 — K Closest Points to Origin', '324 — Wiggle Sort II'],
    introduction: 'Quick sort is one of the most widely used sorting algorithms due to its high performance. It works by selecting a pivot element and partitioning the array around it. Elements smaller than the pivot go to one side and larger elements go to the other. The process is then repeated recursively. Quick sort is often faster than other sorting algorithms in practice.'
  },
  { 
    id: 'recursion', 
    title: 'Recursion', 
    videoLink: 'https://youtu.be/M2uO2nMT0Bk?si=pjDOAGst8_wpj-YK', 
    category: 'programming',
    subtasks: ['Base Conditions', 'Recursion Tree', 'Stack Management', 'Recurrence Relations'],
    homework: ['509 — Fibonacci Number', '231 — Power of Two', '206 — Reverse Linked List', '234 — Palindrome Linked List', '50 — Pow(x, n)'],
    introduction: 'Recursion is a programming technique where a function calls itself to solve smaller parts of a problem. It is commonly used for problems that have a repeating structure. Recursive solutions often make code more elegant and easier to understand. However, they require careful design to avoid infinite loops. Many advanced algorithms rely heavily on recursion.'
  },
  { 
    id: 'complexity', 
    title: 'Time and Space Complexity', 
    videoLink: 'https://youtu.be/mV3wrLBbuuE?si=fc_dktYlekqgSE5e', 
    category: 'programming',
    subtasks: ['Big O Notation', 'Omega/Theta', 'Best/Worst/Average', 'Analyzing Loops'],
    homework: ['1480 — Running Sum of 1d Array', '1672 — Richest Customer Wealth', '1431 — Kids With the Greatest Number of Candies', '1920 — Build Array from Permutation', '2011 — Final Value of Variable After Performing Operations'],
    introduction: 'Time complexity measures how the running time of an algorithm grows as the input size increases. Space complexity measures the amount of memory used by the algorithm. These concepts help evaluate the efficiency of different solutions. In interviews, choosing an optimal algorithm often depends on analyzing complexity. Understanding Big-O notation is essential for comparing algorithm performance.'
  },
  { 
    id: 'backtracking', 
    title: 'Backtracking', 
    videoLink: 'https://youtu.be/zg5v2rlV1tM?si=Ng2IDqtSDfsm_1RM', 
    category: 'programming',
    subtasks: ['State Space Tree', 'Pruning', 'N-Queens / Sudoku Basics', 'Combinations/Permutations'],
    homework: ['78 — Subsets', '46 — Permutations', '39 — Combination Sum', '17 — Letter Combinations of a Phone Number', '131 — Palindrome Partitioning'],
    introduction: 'Backtracking is a problem-solving technique used to explore all possible solutions. It works by trying a solution, checking if it works, and undoing it if it does not. This approach is commonly used in puzzles and combinatorial problems. Examples include generating permutations and solving Sudoku. Backtracking helps understand recursive exploration of solution spaces.'
  },
  { 
    id: 'oop-intro', 
    title: 'Classes and Objects', 
    videoLink: 'https://youtu.be/BSVKUk58K6U?si=Jh5Mbz-cEWlLUVGq', 
    category: 'programming',
    subtasks: ['Constructor Logic', 'Memory allocation', 'This Keyword', 'Garbage Collection'],
    homework: ['1603 — Design Parking System', '705 — Design HashSet', '706 — Design HashMap', '622 — Design Circular Queue', '641 — Design Circular Deque'],
    introduction: 'Classes and objects are the building blocks of object-oriented programming. A class defines the structure and behavior of objects. An object represents a real-world entity with properties and actions. This concept helps organize programs into modular components. Learning classes and objects is essential for writing scalable and maintainable software.'
  },
  { 
    id: 'oop-principles', 
    title: 'OOP Principles', 
    videoLink: 'https://youtu.be/46T2wD3IuhM?si=96HblucyqOARCm1q', 
    category: 'programming',
    subtasks: ['Extends/Implements', 'Overloading/Overriding', 'Interfaces vs Abstract Classes', 'Access Modifiers'],
    homework: ['1472 — Design Browser History', '622 — Design Circular Queue', '1381 — Design a Stack With Increment Operation', '355 — Design Twitter', '981 — Time Based Key Value Store'],
    introduction: 'Object-Oriented Programming is based on four main principles: encapsulation, inheritance, polymorphism, and abstraction. These principles help design flexible and reusable code. Encapsulation protects data, while inheritance allows code reuse. Polymorphism enables multiple behaviors for the same method. Abstraction simplifies complex systems by focusing on essential features.'
  },
  { 
    id: 'linked-list', 
    title: 'Linked List', 
    videoLink: 'https://youtu.be/58YbpRDc4yw?si=yLX50Hj7E-Zy3Rdr', 
    category: 'programming',
    subtasks: ['Node Architecture', 'Insertion/Deletion', 'Reversing a List', 'Cycle Detection'],
    homework: ['206 — Reverse Linked List', '21 — Merge Two Sorted Lists', '141 — Linked List Cycle', '19 — Remove Nth Node From End of List', '83 — Remove Duplicates from Sorted List', '876 — Middle of the Linked List'],
    introduction: 'A linked list is a dynamic data structure where elements are connected using pointers. Unlike arrays, linked lists do not require contiguous memory locations. This makes insertion and deletion operations efficient. Linked lists are commonly used in many applications such as memory management. Understanding linked lists is fundamental for learning advanced data structures.'
  },
  { 
    id: 'stacks-queues', 
    title: 'Stack & Queue', 
    videoLink: 'https://youtu.be/rHQI4mrJ3cg?si=cJmEFGHb9zeGRuWk', 
    category: 'programming',
    subtasks: ['LIFO vs FIFO', 'Dynamic Implementation', 'Standard Library (Deque)', 'Queue using Stacks'],
    homework: ['20 — Valid Parentheses', '155 — Min Stack', '232 — Implement Queue using Stacks', '739 — Daily Temperatures', '933 — Number of Recent Calls'],
    introduction: 'Stacks and queues are linear data structures used to manage ordered collections of elements. A stack follows the Last In First Out (LIFO) principle, while a queue follows the First In First Out (FIFO) principle. These structures are widely used in algorithms, parsing, and scheduling tasks. They help manage data flow in programs. Understanding them is important for solving many interview problems.'
  },
  { 
    id: 'hashmap', 
    title: 'HashMap & HashTable', 
    videoLink: 'https://youtu.be/XLbvmMz8Fr8?si=8PX3IJtkSc31MQIp', 
    category: 'programming',
    subtasks: ['Hashing Mechanics', 'Collision Resolution', 'Load Factor', 'Internal Implementation'],
    homework: ['1 — Two Sum', '347 — Top K Frequent Elements', '49 — Group Anagrams', '560 — Subarray Sum Equals K', '219 — Contains Duplicate II'],
    introduction: 'Hash maps and hash tables store data in key-value pairs. They allow very fast insertion, deletion, and lookup operations. These structures use a hashing function to determine where data should be stored. They are widely used in real-world applications such as databases and caching systems. Many interview problems involve efficient use of hash maps.'
  },
  { 
    id: 'binary-tree', 
    title: 'Binary Tree', 
    videoLink: 'https://youtu.be/4s1Tcvm00pA?si=wdgZHqNwRHx5tYgn', 
    category: 'programming',
    subtasks: ['Tree Properties', 'BFS / DFS Concepts', 'Building a Tree', 'Standard Problems'],
    homework: ['104 — Maximum Depth of Binary Tree', '100 — Same Tree', '226 — Invert Binary Tree', '543 — Diameter of Binary Tree', '111 — Minimum Depth of Binary Tree'],
    introduction: 'A binary tree is a hierarchical data structure where each node has at most two children. It is commonly used to represent hierarchical relationships. Binary trees form the basis for many advanced structures such as heaps and binary search trees. Understanding binary trees helps in solving many recursive and traversal problems. They are frequently asked in coding interviews.'
  },
  { 
    id: 'traversals', 
    title: 'Tree Traversals', 
    videoLink: 'https://youtu.be/LFGBTFxHJII?si=yG6N2Qk04eG1eejd', 
    category: 'programming',
    subtasks: ['Recursive Approach', 'Iterative Approach', 'Postorder Logic', 'Reconstructing from Traversal'],
    homework: ['94 — Binary Tree Inorder Traversal', '144 — Binary Tree Preorder Traversal', '145 — Binary Tree Postorder Traversal', '102 — Binary Tree Level Order Traversal', '103 — Binary Tree Zigzag Level Order Traversal'],
    introduction: 'Tree traversal refers to visiting all nodes of a tree in a specific order. The main traversal methods include inorder, preorder, and postorder traversal. Each traversal method serves different purposes depending on the problem. Traversals are often implemented using recursion or stacks. Mastering these techniques is important for working with tree data structures.'
  },
  { 
    id: 'avl', 
    title: 'AVL Trees / BST Concepts', 
    videoLink: 'https://youtu.be/CVA85JuJEn0?si=N1rkFy45aaabqIaA', 
    category: 'programming',
    subtasks: ['Self-Balancing Logic', 'Rotations (LL/RR/LR/RL)', 'Height Balance Factor', 'Complexity Analysis'],
    homework: ['98 — Validate Binary Search Tree', '235 — Lowest Common Ancestor of a BST', '701 — Insert into a Binary Search Tree', '450 — Delete Node in a BST', '700 — Search in a Binary Search Tree'],
    introduction: 'AVL trees are self-balancing binary search trees. They automatically maintain their height to ensure efficient operations. When the tree becomes unbalanced, rotations are used to restore balance. This guarantees that search, insertion, and deletion operations remain efficient. AVL trees are important for understanding balanced tree structures used in databases and indexing systems.'
  }
];

export const CORE_CONCEPTS_TOPICS: PrepTopic[] = [
  {
    id: 'os',
    title: 'Operating System',
    videoLink: 'https://youtu.be/Fw5JDDNFDPY?si=WgrpheGPxHYoRhRh',
    category: 'core',
    subtasks: ['Process Management', 'CPU Scheduling', 'Deadlocks', 'Memory Management'],
    homework: ['Explain Process State Diagram', 'FCFS vs SJF Scheduling', 'Bankers Algorithm for Deadlock', 'Paging vs Segmentation'],
    introduction: 'An Operating System (OS) is a software that acts as an interface between computer hardware components and the user. It manages computer hardware, software resources, and provides common services for computer programs. Key concepts include process management, memory management, file systems, and security.',
    quizzes: []
  },
  {
    id: 'dbms',
    title: 'DBMS',
    videoLink: 'https://youtu.be/c5HAwKX-suM?si=7wUyYUoCnfiuKGHq',
    category: 'core',
    subtasks: ['Relational Model', 'SQL Queries', 'Normalization (1NF, 2NF, 3NF)', 'ACID Properties'],
    homework: ['Write a complex SQL Join', 'Normalize a table to 3NF', 'Explain B-Trees and B+ Trees', 'Compare NoSQL and SQL'],
    introduction: 'A Database Management System (DBMS) is software used to store, retrieve, and run queries on data. It serves as an interface between the database and its end users or programs, allowing users to create, read, update, and delete data in the database. Understanding relational models, SQL, and data integrity is crucial.',
    quizzes: []
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    videoLink: 'https://youtu.be/IPvYjXCsTg8?si=vUMGK9OJIo1i-6Pj',
    category: 'core',
    subtasks: ['OSI Model Layers', 'TCP/IP Protocol Suite', 'IP Addressing (IPv4/v6)', 'Routing Algorithms'],
    homework: ['Explain 7 Layers of OSI', 'Difference between TCP and UDP', 'Calculate Subnet Masks', 'Explain HTTP vs HTTPS'],
    introduction: 'Computer Networking refers to interconnected computing devices that can exchange data and share resources with each other. These networked devices use a system of rules, called communications protocols, to transmit information over physical or wireless technologies. Knowledge of network layers and protocols is fundamental.',
    quizzes: []
  },
  {
    id: 'oop',
    title: 'Object Oriented Programming',
    videoLink: 'https://youtu.be/SiBw7os-_zI?si=_ECbIEr3UnzoyHti',
    category: 'core',
    subtasks: ['Classes and Objects', 'Inheritance', 'Polymorphism', 'Abstraction & Encapsulation'],
    homework: ['Implement an Abstract Class', 'Show Method Overloading vs Overriding', 'Explain Interface vs Abstract Class', 'Demonstrate Encapsulation with Private Fields'],
    introduction: 'Object-oriented programming (OOP) is a programming paradigm based on the concept of "objects", which can contain data and code: data in the form of fields, and code, in the form of procedures. OOP aims to implement real-world entities like inheritance, hiding, polymorphism, etc. in programming.',
    quizzes: []
  }
];

// Mock questions have been removed. All questions are now dynamically generated via Gemini AI.
