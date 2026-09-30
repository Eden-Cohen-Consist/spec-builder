import FreeTextBlock from "../FreeTextBlock.jsx";
import TestDataBlock from "../TestDataBlock.jsx";
import TableBlock from "../TableBlock.jsx";

export default function BlockBody({ block, errors, onUpdate }) {
  switch (block.type) {
    case "freeText":
      return (
        <FreeTextBlock block={block} errors={errors} onUpdate={onUpdate} />
      );
    case "testData":
      return (
        <TestDataBlock block={block} errors={errors} onUpdate={onUpdate} />
      );
    case "table":
      return <TableBlock block={block} errors={errors} onUpdate={onUpdate} />;
    default:
      return null;
  }
}
