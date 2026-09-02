# Card

A sunken inset panel for one record inside a list: a tracked vessel, a fleet entry

```ts
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
```

A styled `div`, so `styled(Card)` extends it.

<<< ../../../template/client/src/ui/Card.tsx#example

For a plain list row rather than a boxed record, use [Row](/reference/ui-kit/Row). A page of Cards reads as a gallery; a page of Rows reads as a list.
