// client/src/components/CategoryTree.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function renderTree(nodes, onSelect, onDragStart, onDrop) {
  return nodes.map(node => (
    <div key={node._id} style={{ marginLeft: node.level * 20 }} draggable onDragStart={e => onDragStart(e, node)} onDrop={e => onDrop(e, node)}>
      <span onClick={() => onSelect(node)}>{node.name}</span>
      {node.children && node.children.length > 0 && (
        <div>{renderTree(node.children, onSelect, onDragStart, onDrop)}</div>
      )}
    </div>
  ));
}

const CategoryTree = ({ onSelectCategory }) => {
  const [tree, setTree] = useState([]);
  const [dragged, setDragged] = useState(null);

  useEffect(() => {
    axios.get('/api/categories/tree').then(res => setTree(res.data));
  }, []);

  const handleSelect = node => {
    if (onSelectCategory) onSelectCategory(node);
  };

  const handleDragStart = (e, node) => {
    setDragged(node);
  };

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    if (dragged && dragged._id !== targetNode._id) {
      await axios.put(`/api/categories/${dragged._id}`, { parentCategoryId: targetNode._id, level: (targetNode.level || 0) + 1 });
      axios.get('/api/categories/tree').then(res => setTree(res.data));
    }
    setDragged(null);
  };

  return (
    <div>
      <h3>Category Tree</h3>
      <div>{renderTree(tree, handleSelect, handleDragStart, handleDrop)}</div>
    </div>
  );
};

export default CategoryTree;
