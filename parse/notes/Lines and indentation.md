# Lines and indentation

- Each line has an expected indentation.
  - The expected indentation has a minimum prefix.
- The next line has one of the following:
  - only the trimmed indentation, with no other characters
  - the indentation
  - less indentation
  - incorrect indentation
  
```ms
- A
  - a
  
    Continued
    
    > a
    >
    > continued
    > - item
    >
    >   continued
    >   > a
    >   > - item
    >   >
    >   >   continued
    >   >
    >   >               continued
    >   >> illegal
    >   > > legal
    >   >  > illegal
    >   >   > legal
    >   >    > illegal
    >   >     > illegal
```
